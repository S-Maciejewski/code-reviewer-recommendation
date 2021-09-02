import {API_KEY, API_URL} from '../env'
import {HttpClient} from './HttpClient'
import {AxiosResponse} from 'axios'

// Github GraphQL API query explorer: https://developer.github.com/v4/explorer/

export class ApiAdapter extends HttpClient {
    public constructor() {
        super(API_URL)
    }

    async getApiResponse(query: string): Promise<AxiosResponse<any>> {
        return this.instance.post<any>('', JSON.stringify({query}), {
            headers: {
                'Authorization': `token ${API_KEY}`,
                'Content-Type': 'application/json',
            }
        })
    }
}