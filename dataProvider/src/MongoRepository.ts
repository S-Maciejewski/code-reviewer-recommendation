import mongoose from 'mongoose'
import {RepositorySchema, FilterQuery} from './models'
import {MONGO_COLLECTION} from "../env";

export class MongoRepository {
    private database: mongoose.Connection
    private uri: string

    constructor(uri: string) {
        this.uri = uri
    }

    connect = async () => {
        if (this.database) return
        await mongoose.connect(this.uri, {
            useNewUrlParser: true,
            useFindAndModify: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
        })

        this.database = mongoose.connection
        this.database.once('open', () => console.log('Connected to database'))
        this.database.once('error', () => console.log('Error while connecting to database'))
    }

    disconnect = () => {
        if (!this.database) return
        return mongoose.disconnect()
    }

    saveToDatabase = async <T>(value: T) => {
        const model = mongoose.model(MONGO_COLLECTION, RepositorySchema)
        const instance = new model(value)
        return instance.save({checkKeys: false})
    }

    getDb = () => {
        return this.database.db
    }

    pushToArray = <T>(filter: FilterQuery, arrayName: string, arrayValues: T[]) => {
        return this.database.collection(MONGO_COLLECTION).updateOne(filter, {
            '$push': {
                [arrayName]: {
                    '$each': [...arrayValues.map(val => JSON.stringify(val))]
                }
            }
        })
    }

    removeDocument = (filter: FilterQuery) => {
        return this.database.collection(MONGO_COLLECTION).deleteMany(filter)
    }
}