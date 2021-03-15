import {
    getModelForClass,
    ModelType,
    DocType,
    InstanceType,
    setSchema,
    prop,
    arrayProp,
    getSchema,
    setPlugin,
} from 'mongoose-ts-ua';
import { Types, SchemaTypes } from 'mongoose';

import { myEnum } from '@/config/enum';

import { ContentContactBase } from '../content/content-contact';
import { IPagination, pagination } from '../_plugins/pagination';

type viewHistory = typeof ViewHistory & IPagination<ViewHistory>;
export type ViewHistoryInstanceType = InstanceType<ViewHistory>;
export type ViewHistoryModelType = ModelType<ViewHistory, viewHistory>;
export type ViewHistoryDocType = DocType<ViewHistoryInstanceType>;

@setSchema()
export class ViewHistory extends ContentContactBase {
    @prop()
    viewAt: Date;
}

let schema = getSchema(ViewHistory);
schema.index({ ownerId: 1, userId: 1 }, { unique: true });

export const ViewHistoryModel = getModelForClass<ViewHistory, viewHistory>(ViewHistory);