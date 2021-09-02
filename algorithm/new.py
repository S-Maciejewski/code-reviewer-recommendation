import collections
import json
import sys
import datetime


def intersection(list1, list2):
    return list(set(list1) & set(list2))


class ReviewsParser:
    @staticmethod
    def reviews_from(file):
        with open(file) as f: reviews = json.load(f)

        pull_requests = [PullRequest(index, review) for index, review in enumerate(reviews)]
        pull_requests = sorted([pull_request for pull_request in pull_requests if pull_request.has_reviewers()])

        return pull_requests


class Evaluator:
    def __init__(self):
        # reviewers are stored as a hash: { reviewer_id: Reviewer(profile, last_review_date) }
        self.reviewers_profiles = collections.defaultdict(Reviewer)
        self.metrics = Metrics()

    def run(self, pull_requests):
        for pull_request in pull_requests:
            recommended_reviewers = RecommendationAlgorithm(self.reviewers_profiles, pull_request).results()
            self.metrics.update(pull_request.reviewers, recommended_reviewers)
            self.__update_reviewers_profiles(pull_request)

        return self.metrics.results()

    def __update_reviewers_profiles(self, pull_request):
        for id in pull_request.reviewers:
            self.reviewers_profiles[id].profile += pull_request.bow
            self.reviewers_profiles[id].last_review_date = pull_request.time


class RecommendationAlgorithm:
    def __init__(self, reviewers, pull_request, alpha=0.0):
        self.reviewers = reviewers
        self.pull_request = pull_request
        self.alpha = alpha

    def __get_tversky_index(self, reviewer_profile):
        pull_request_bow = self.pull_request.bow

        diff1 = sum((reviewer_profile - pull_request_bow).values())
        diff2 = sum((pull_request_bow - reviewer_profile).values())
        intersection = sum((pull_request_bow & reviewer_profile).values())

        return intersection / (intersection + self.alpha * diff1 + (1 - self.alpha) * diff2)

    def results(self, k=10):
        scores = {}
        for reviewer_id, reviewer in self.reviewers.items():
            scores[reviewer_id] = self.__get_tversky_index(reviewer.profile)

        # firstly compare reviewers' scores, then the last review date if the score is the same
        # item[0] is reviewer's id, item[1] is their score
        comparison_function = lambda item: (item[1], self.reviewers[item[0]].last_review_date)

        # do not include reviewers with score 0
        recommended_reviewer_ids = [id for id, score in sorted(scores.items(),
                                                               key=comparison_function, reverse=True) if score != 0]

        return recommended_reviewer_ids[:k]


class PullRequest:
    def __init__(self, id, json):
        self.id = id
        self.time = datetime.datetime.strptime(json["submit_date"][:19], "%Y-%m-%d %H:%M:%S")
        self.files = list(map(lambda filepath: filepath.split("/"), json["files"]))
        self.reviewers = list(set([item["userId"] for item in json['approve_history'] if item['approve_value'] == 2]))
        self.bow = self.__bow()

    def __gt__(self, pull_request_2):
        return self.time > pull_request_2.time

    def __eq__(self, pull_request_2):
        return self.time == pull_request_2.time

    def has_reviewers(self):
        return len(self.reviewers) > 0

    def __bow(self):
        bow = collections.Counter()
        for file_path_as_list in self.files:
            bow.update(file_path_as_list)
        return bow


class Reviewer:
    def __init__(self):
        self.profile = collections.Counter()
        self.last_review_date = 0


class Metrics:
    def __init__(self):
        # for precision and recall 
        self.correctly_predicted_count = collections.Counter()
        self.all_predicted_count = collections.Counter()
        self.all_reviewers_count = 0.0
        # for mrr
        self.mrr_sum = 0.0
        self.mrr_count = 0.0

    def update(self, actual_reviewers, suggested_reviewers):
        # update precision and recall metrics (all suggested reviewers and correct reviewers)
        for i in range(1, 11):
            self.all_predicted_count[i] += len(suggested_reviewers[:i])
            self.correctly_predicted_count[i] += len(intersection(suggested_reviewers[:i], actual_reviewers))
        self.all_reviewers_count += len(actual_reviewers)  # instead of 1 in the original code

        # update mrr
        for index, suggested_reviewer in enumerate(suggested_reviewers):
            if suggested_reviewer in actual_reviewers:
                rank = index + 1
                self.mrr_sum += 1.0 / rank
                break
        self.mrr_count += 1

    def results(self):
        precision = collections.Counter()
        recall = collections.Counter()

        for n, correct_predictions_count in self.correctly_predicted_count.items():
            precision[n] = float(correct_predictions_count) / self.all_predicted_count[n]
            recall[n] = float(correct_predictions_count) / self.all_reviewers_count

        mrr = self.mrr_sum / self.mrr_count

        return (precision, recall, mrr)


def print_top_n_metrics(metrics, name):
    print(name)
    for n in sorted(metrics): 
        print("%f" % (float(metrics[n])))
    
def print_csv(metrics):
    return ",".join([("%f" % (float(metrics[n]))) for n in sorted(metrics)])

def print_metrics(precision, recall, mrr):
    if sys.argv[-1] == "--csv":
        name = sys.argv[1].split("/")[-1].split(".")[0] + "-" + sys.argv[0].split(".")[0]
        print(name, print_csv(precision), print_csv(recall), "%f" % (mrr), sep=",")
    else:
        print("-----")
        print_top_n_metrics(precision, "Precision")
        print("-----")
        print_top_n_metrics(recall, "Recall")
        print("-----")
        print("Mean reciprocal rank = %f" % (mrr))
        print("-----")


def main():
    filepath = sys.argv[1]
    
    pull_requests = ReviewsParser.reviews_from(filepath)
    
    metrics = Evaluator().run(pull_requests)
    
    print_metrics(*metrics)
        
if __name__ == '__main__':
    main()
