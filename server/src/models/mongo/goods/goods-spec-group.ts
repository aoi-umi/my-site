import {
    getModelForClass, ModelType, DocType, InstanceType,
    setSchema, prop, arrayProp, getSchema
} from 'mongoose-ts-ua';
import { Types, SchemaTypes } from 'mongoose';

import { myEnum } from '@/config';

import { Base } from '../_base';
export type GoodsSpecGroupInstanceType = InstanceType<GoodsSpecGroup>;
export type GoodsSpecGroupModelType = ModelType<GoodsSpecGroup, typeof GoodsSpecGroup>;
export type GoodsSpecGroupDocType = DocType<GoodsSpecGroupInstanceType>;

@setSchema()
export class GoodsSpecGroup extends Base {
    @prop({
        type: SchemaTypes.ObjectId,
        required: true
    })
    spuId: Types.ObjectId;

    @prop({
        required: true,
    })
    name: string;

    @arrayProp({
        required: true,
        type: String
    })
    value: string[];
}

export const GoodsSpecGroupModel = getModelForClass<GoodsSpecGroup, typeof GoodsSpecGroup>(GoodsSpecGroup);
