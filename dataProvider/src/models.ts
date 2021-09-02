import * as mongoose from 'mongoose'

export type ChangedFile = {
    path: string
    extension: string
}

export type ExtensionPathBOW = {
    extension: string
    bow: BOW
}

export type BOW = {
    [value: string]: number
}

export type Review = {
    author: string
    createdAt: Date
    state: string
}

export interface PullRequest {
    author: string
    title: string
    files: string[]
    createdAt: Date
    closedAt: Date
    mergedBy: string
    mergedAt: Date
    url: string
    number: number
    state: string
    reviews: Review[]
    bagOfWords?: ExtensionPathBOW[]
}

export class PullRequest implements PullRequest {
    constructor(
        author: string,
        title: string,
        files: string[],
        createdAt: string,
        closedAt: string,
        mergedBy: string,
        mergedAt: string,
        url: string,
        number: number,
        state: string,
        reviews: Review[]
    ) {
        this.author = author
        this.title = title
        this.files = files
        this.createdAt = new Date(createdAt)
        this.closedAt = state === 'MERGED' || state === 'CLOSED' ? new Date(closedAt) : undefined
        this.mergedBy = state === 'MERGED' ? mergedBy : undefined
        this.mergedAt = state === 'MERGED' ? new Date(mergedAt) : undefined
        this.url = url
        this.number = number
        this.state = state
        this.reviews = reviews
    }
}

export type Repository = {
    owner: string
    name: string
    pullRequests: PullRequest[]
    issues: Issue[]
}

export type Issue = {
    author: string
    title: string
    createdAt: Date
    closedAt: Date
    bodyText: string
    comments: IssueComment[]
    state: string
}

export type IssueComment = {
    author: string
    bodyText: string
    updatedAt: Date
}

export type FilterQuery = { owner: string, name: string }

export const RepositorySchema = new mongoose.Schema({
    owner: String,
    name: String,
    pullRequests: [Object],
    issues: [Object]
})