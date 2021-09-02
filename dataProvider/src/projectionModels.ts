export type RevfinderPullRequestModel = {
    status: 'M' | 'A'
    approve_history: RevfinderHistoryEntry[]
    submit_date: Date
    changeId: number
    project: string
    close_date: Date
    files: string[]
}

export type RevfinderHistoryEntry = {
    userId: string // originally a number, TODO: check if python script accepts strings
    approve_value: -2 | 2
    grant_date: Date
}