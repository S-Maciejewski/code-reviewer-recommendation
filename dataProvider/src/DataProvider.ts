import {Issue, PullRequest, Repository, FilterQuery} from './models'
import {queries} from './queries'
import {ApiAdapter} from './ApiAdapter'
import {getExtensionPathBOWs, getIssues, getPullRequestsPage} from './parsers'
import * as R from 'ramda'
import {saveResultsFile} from './output'
import {MongoRepository} from './MongoRepository'
import {MONGO_COLLECTION} from '../env'
import {RevfinderHistoryEntry, RevfinderPullRequestModel} from './projectionModels'


export class DataProvider {
    private apiAdapter: ApiAdapter
    private mongo: MongoRepository
    private readonly repositoryOwner: string
    private readonly repositoryName: string
    private readonly filterQuery: FilterQuery

    constructor(apiAdapter: ApiAdapter, mongo: MongoRepository, repositoryOwner: string, repositoryName: string) {
        this.apiAdapter = apiAdapter
        this.mongo = mongo
        this.repositoryOwner = repositoryOwner
        this.repositoryName = repositoryName
        this.filterQuery = {name: repositoryName, owner: repositoryOwner}
    }

    fetchData = async (batched = false, saveLocal = false): Promise<Repository> => {
        await this.mongo.removeDocument(this.filterQuery)

        const repository = {
            owner: this.repositoryOwner,
            name: this.repositoryName,
        } as Repository

        if (!batched) {
            const pullRequests = (await this.getAllPullRequests())
                .map((pr: PullRequest) => ({...pr, bagOfWords: getExtensionPathBOWs(pr.files)}))
            const issues = await this.getAllIssues()

            repository.pullRequests = pullRequests
            repository.issues = issues

            if (saveLocal) saveResultsFile(`${this.repositoryOwner}_${this.repositoryName}.json`, repository)
            await this.mongo.saveToDatabase(repository)
                .then(() => console.log(`Repository ${this.repositoryName} saved`))
                .catch(err => console.error(err))
        } else {
            await this.mongo.saveToDatabase(repository)
                .then(() => console.log('Empty repository saved, populating with batched data...'))
                .catch(err => console.error(err))

            await this.getAllPullRequests(true)
            await this.getAllIssues(true)
            console.log(`Repository ${this.repositoryName} populated`)
        }

        return repository
    }

    getRevfinderProjection = async () => {
        const db = this.mongo.getDb()
        const pullRequests = (await db.collection(MONGO_COLLECTION).find({
            owner: this.repositoryOwner,
            name: this.repositoryName
        }).toArray())[0].pullRequests as PullRequest[]

        let res = []
        res = pullRequests
            .filter(pr => pr.closedAt) // Take ino account only closed PRs
            .map(pr => ({
                status: pr.state === 'MERGED' ? 'M' : 'A',
                submit_date: pr.createdAt,
                close_date: pr.closedAt,
                project: `${this.repositoryOwner}/${this.repositoryName}`,
                changeId: pr.number,
                files: pr.files,
                approve_history: pr.reviews.map(review => ({
                    userId: review.author,
                    approve_value: review.state === 'APPROVED' ? 2 : -2,
                    grant_date: review.createdAt
                }) as RevfinderHistoryEntry)
            }) as RevfinderPullRequestModel)
        return res
    }

    private getAllPullRequests = async (batched = false): Promise<PullRequest[]> => {
        let pullRequests = []
        let res = await this.apiAdapter.getApiResponse(queries.pullRequests(this.repositoryOwner, this.repositoryName))

        pullRequests = getPullRequestsPage(res)
        console.info(`Fetched ${pullRequests.length} pull requests`)
        if (batched) {
            await this.mongo.pushToArray<PullRequest>(this.filterQuery, 'pullRequests', pullRequests)
        }

        let endCursor = res.data.repository.pullRequests.pageInfo.endCursor
        while (!R.isNil(endCursor)) {
            res = await this.apiAdapter.getApiResponse(queries.pullRequests(this.repositoryOwner, this.repositoryName,
                endCursor))
            endCursor = res.data.repository.pullRequests.pageInfo.endCursor

            if (batched) {
                pullRequests = getPullRequestsPage(res)
                await this.mongo.pushToArray<PullRequest>(this.filterQuery, 'pullRequests', pullRequests)
            } else {
                pullRequests = [...pullRequests, ...getPullRequestsPage(res)]
            }
            console.info(`Fetched ${pullRequests.length} pull requests`)
        }
        return pullRequests
    }

    private getAllIssues = async (batched = false): Promise<Issue[]> => {
        let issues = []
        let res = await this.apiAdapter.getApiResponse(queries.issues(this.repositoryOwner, this.repositoryName))

        issues = getIssues(res)
        let endCursor = res.data.repository.issues.pageInfo.endCursor
        console.info(`Fetched ${issues.length} issues`)
        if (batched) {
            await this.mongo.pushToArray<Issue>(this.filterQuery, 'issues', issues)
        }

        while (!R.isNil(endCursor)) {
            res = await this.apiAdapter.getApiResponse(queries.issues(this.repositoryOwner, this.repositoryName,
                endCursor))
            endCursor = res.data.repository.issues.pageInfo.endCursor

            if (batched) {
                issues = getIssues(res)
                await this.mongo.pushToArray<Issue>(this.filterQuery, 'issues', issues)
            } else {
                issues = [...issues, ...getIssues(res)]
            }
            console.info(`Fetched ${issues.length} issues`)
        }
        return issues
    }
}

