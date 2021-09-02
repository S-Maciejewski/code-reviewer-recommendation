import {BOW, ChangedFile, ExtensionPathBOW, Issue, IssueComment, PullRequest, Review} from './models'

export const getPullRequestsPage = (res: any): PullRequest[] => {
    return res.data.repository.pullRequests.nodes.map((
        node: any,
    ) => (new PullRequest(
        node.author?.login,
        node.title,
        node.files.nodes.map((fileNode: { path: string }) => fileNode.path),
        node.createdAt,
        node.closedAt,
        node.mergedBy?.login,
        node.mergedAt,
        node.url,
        node.number,
        node.state,
        getReviews(node.reviews)
    )))
}

export const getPathsBOW = (paths: string[]): BOW => {
    const splitPaths = paths.map((path) => path.split('/')).flat().map((word) =>
        word.toLowerCase()
    )
    const uniqueWords = [...new Set(splitPaths)]

    return Object.fromEntries(
        uniqueWords.map((word) => [
            word,
            splitPaths.filter((pathWord) => pathWord === word).length,
        ]),
    )
}

export const getExtensionPathBOWs = (paths: string[]): ExtensionPathBOW[] => {
    const changedFiles = paths.map((path: string) => {
            const extensionIndex = path.lastIndexOf('.')
            return {
                path: path.substring(0, extensionIndex),
                extension: path.substring(extensionIndex + 1),
            } as ChangedFile
        }
    )
    const extensions = [...new Set(changedFiles.map((changedFile) => changedFile.extension))]

    return extensions.map((extension) => {
        const pathsForExtension = changedFiles.filter((changedFile) =>
            changedFile.extension === extension
        ).map((changedFile) => changedFile.path)

        return ({
            extension,
            bow: getPathsBOW(pathsForExtension),
        }) as ExtensionPathBOW
    })
}

export const getIssues = (res: any): Issue[] => {
    return res.data.repository.issues.nodes.map((node: any) => ({
        author: node.author?.login,
        title: node.title,
        bodyText: node.bodyText,
        state: node.state,
        createdAt: new Date(node.createdAt),
        closedAt: node.state !== 'OPEN' ? new Date(node.closedAt) : undefined,
        comments: getIssueComments(node.comments)
    }) as Issue)
}

const getIssueComments = (commentsNode: any): IssueComment[] => {
    return commentsNode.nodes.map((node: any) => ({
        author: node.author?.login,
        bodyText: node.bodyText,
        updatedAt: new Date(node.updatedAt)
    }) as IssueComment)
}

const getReviews = (reviewsNode: any): Review[] => {
    return reviewsNode.nodes.map((node: any) => ({
        author: node.author?.login,
        createdAt: new Date(node.createdAt),
        state: node.state
    }) as Review)
}