import {ApiAdapter} from './ApiAdapter'
import {MongoRepository} from './MongoRepository'
import {MONGO_URI} from '../env'
import {DataProvider} from './DataProvider'
import {saveResultsFile} from './output'
import fetchConfig from '../fetchConfig.json'
import revfinderProjectionConfig from '../revfinderProjectionConfig.json'

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('source-map-support').install()

const apiAdapter = new ApiAdapter()
const mongo = new MongoRepository(MONGO_URI)

async function fetchRepository(owner: string, name: string, batched = false) {
    const dataProvider = new DataProvider(apiAdapter, mongo, owner, name)
    await dataProvider.fetchData(batched)
}

async function fetchAllRepositories() {
    for (const repo of fetchConfig) {
        await fetchRepository(repo.owner, repo.name, repo.batched)
    }
}

async function getAllProjections() {
    for (const repo of revfinderProjectionConfig) {
        const dataProvider = new DataProvider(apiAdapter, mongo, repo.owner, repo.name)
        const res = await dataProvider.getRevfinderProjection()
        saveResultsFile(`${repo.owner}_${repo.name}_revfinder.json`, res)
    }
}

async function mongoSession() {
    await mongo.connect()

    // const owner = 'bevyengine'
    // const name = 'bevy'
    // const dataProvider = new DataProvider(apiAdapter, mongo, owner, name)

    // await dataProvider.fetchData(true)
    // const res = await dataProvider.getRevfinderProjection()
    // saveResultsFile('revfinder_projection.json', res)
    // await mongo.disconnect()
}

mongoSession().then(() => {
    fetchAllRepositories().then(() => {
        console.log('All repositories fetched')
        getAllProjections().then(() => {
            console.log('All projections fetched')
            mongo.disconnect()
        })
    })
})