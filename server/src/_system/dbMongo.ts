import * as Q from 'q';
import * as mongoose from 'mongoose';
import { Model, Types, ConnectOptions } from 'mongoose';
import { config as mongooseTsConfig } from 'mongoose-ts-ua';
import { ClientSession } from 'mongodb';
import * as common from './common';

export async function transaction(
  fn: (session: ClientSession) => any,
  conn?: mongoose.Connection,
) {
  const session = await (conn || mongoose.connection).startSession();
  session.startTransaction({
    readConcern: {
      level: 'snapshot',
    },
    writeConcern: {
      w: 'majority',
    },
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
    if (coll[collectionName]) return;
    coll[collectionName] = true;
    let listCol = model.collection.conn.db.listCollections({
      name: collectionName,
    });
    let t = await Q.denodeify<any[]>(listCol.toArray.bind(listCol))();
    if (!t.length) {
      let x = await model.collection.conn.createCollection(collectionName);
    }
  })().catch((e) => {
    console.log(e);
  });
}
(mongoose.model as any) = function (...args) {
  let model: Model<any> = orgModel.apply(mongoose, args);
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
  options?: ConnectOptions;
};
export async function init(mongoOpt: MongoOpt) {
  mongooseTsConfig.schemaOptions = {
    timestamps: true,
    versionKey: false,
    id: false,
    toJSON: {
      virtuals: true,
    },
  };
  mongooseTsConfig.toCollectionName = common.stringToLowerCaseWithUnderscore;
  await mongoose.connect(mongoOpt.uri, mongoOpt.options);
}

export async function close() {
  await mongoose.disconnect();
}
