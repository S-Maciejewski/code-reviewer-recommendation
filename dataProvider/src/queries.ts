// export interface IQuery {
//   text(): string;
//   setTemplate(queryTemplate: string): void;
//   setOwner(owner: string): void;
//   setName(name: string): void;
// }

export const queries = {
    pullRequests: (repositoryOwner: string, repositoryName: string, prEndCursor?: string) =>
        `
        {
            repository(owner: "${repositoryOwner}", name: "${repositoryName}") {
                name
                pullRequests(first: 50${prEndCursor ? ', after: \"' + prEndCursor + '\"' : ''}) {
                    nodes {
                        merged
                        files(first: 100) {
                            nodes {
                                path
                            }
                        }
                        author {
                            login
                        }
                        createdAt
                        id
                        url
                        title
                        reviews(first: 100) {
                            nodes {
                                author {
                                    login
                                }
                                createdAt
                                id
                                state
                            }
                        }
                        suggestedReviewers {
                            reviewer {
                                name
                            }
                        }
                        closedAt
                        closed
                        mergedAt
                        mergedBy {
                            login
                        }
                        number
                        state
                    }
                    pageInfo {
                        endCursor
                    }
                }
                createdAt
            }
        }
    `,
    issues: (repositoryOwner: string, repositoryName: string, issuesEndCursor?: string) =>
        `
    {
    repository(owner: "${repositoryOwner}", name: "${repositoryName}") {
      name
      issues(first: 100${issuesEndCursor ? ', after: \"' + issuesEndCursor + '\"' : ''}) {
        nodes {
          author {
            login
          }
          bodyText
          comments(last: 100) {
            nodes {
              bodyText
              author {
                login
              }
              updatedAt
            }
          }
          closed
          closedAt
          createdAt
          id
          title
          state
        }
        pageInfo {
            endCursor
        }
      }
    }
  }
  `,
    viewerLogin: () =>
        `
  { 
    viewer 
    { login } 
  }
  `,
}
