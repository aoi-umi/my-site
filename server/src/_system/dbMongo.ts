import * as Q from 'q';
import * as mongoose from 'mongoose';
import { Model, Types, ConnectionOptions } from 'mongoose';
import {
    config as mongooseTsConfig
} from 'mongoose-ts-ua';
import * as mongodb from 'mongodb';
import { ClientSession, CommonOptions } from 'mongodb';
import * as common from './common';

require('mongoose').Promise = Q.Promise;
declare module 'mongoose' {
    type Promise<T> = Q.Promise<T>;

    //补充
    interface Document {
        remove(opt?: CommonOptions, fn?: (err: any, product: this) => void): Promise<this>;
    }
    interface Model<T extends Document, QueryHelpers = {}> {
        deleteMany(conditions: any, opt?: CommonOptions, callback?: (err: any) => void): Query<mongodb.WriteOpResult['result']> & QueryHelpers;

        findByIdAndDelete(id: any, options?: CommonOptions & {
            /** if multiple docs are found by the conditions, sets the sort order to choose which doc to update */
            sort?: any;
            /** sets the document fields to return */
            select?: any;
        }): DocumentQuery<T | null, T> & QueryHelpers;

        findOneAndRemove(conditions: any, options: CommonOptions & {
			/**
			 * if multiple docs are found by the conditions, sets the sort order to choose
			 * which doc to update
			 */
            sort?: any;
            /** puts a time limit on the query - requires mongodb >= 2.6.0 */
            maxTimeMS?: number;
            /** sets the document fields to return */
            select?: any;
        }): DocumentQuery<T | null, T> & QueryHelpers;

        bulkWrite(writes: any[], options?: CommonOptions): Promise<mongodb.BulkWriteOpResultObject>;
    }
}

export async function transaction(fn: (session: ClientSession) => any, conn?: mongoose.Connection) {
    const session = await (conn || mongoose.connection).startSession();
    session.startTransaction({
        readConcern: {
            level: 'snapshot'
        },
        writeConcern: {
            w: 'majority'
        }
    });
    let result;
    try {
        result = await fn(session);
        await session.commitTransaction();
    } catch (e) {
        await session.abortTransaction();
        throw e;
    }
    return result;
}

let orgModel = mongoose.model;
let coll = {};
//事务中无法创建表，定义的时候创建
function createCollection(model) {
    (async () => {
        let collectionName = model.collection.collectionName;
        //防止重复处理
        if (coll[collectionName])
            return;
        coll[collectionName] = true;
        let listCol = model.collection.conn.db.listCollections({
            name: collectionName,
        });
        let t = await Q.denodeify<any[]>(listCol.toArray.bind(listCol))();
        if (!t.length) {
            let x = await model.collection.conn.createCollection(collectionName);
        }
    })().catch(e => {
        console.log(e);
    });
}
(mongoose.model as any) = function () {
    let model: Model<any> = orgModel.apply(mongoose, arguments);
    createCollection(model);
    return model;
};

// mongoose.connection.once('open', () => {
//     for (let key in mongoose.models) {
//         let model = mongoose.models[key];
//         createCollection(model);
//     }
// });
export type MongoOpt = {
    uri: string;
    options?: ConnectionOptions
}
export async function init(mongoOpt: MongoOpt) {
    mongooseTsConfig.schemaOptions = { timestamps: true, versionKey: false, id: false };
    mongooseTsConfig.toCollectionName = common.stringToLowerCaseWithUnderscore;
    await mongoose.connect(mongoOpt.uri, mongoOpt.options);
}

