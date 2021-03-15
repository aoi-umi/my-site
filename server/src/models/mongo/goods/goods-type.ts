import {
    getModelForClass, ModelType, DocType, InstanceType,
    setSchema, prop, arrayProp, getSchema
} from 'mongoose-ts-ua';
import { Types, SchemaTypes } from 'mongoose';

import { myEnum } from '@/config';

import { Base } from '../_base';
export type GoodsTypeInstanceType = InstanceType<GoodsType>;
export type GoodsTypeModelType = ModelType<GoodsType, typeof GoodsType>;
export type GoodsTypeDocType = DocType<GoodsTypeInstanceType>;

@setSchema({
    schemaOptions: {
        toJSON: { virtuals: true }
    }
})
export class GoodsType extends Base {
    @prop({
        required: true,
    })
    name: string;

    @prop({
        required: true
    })
    code: string;

    @prop()
    parentCode: string;
}

export const GoodsTypeModel = getModelForClass<GoodsType, typeof GoodsType>(GoodsType);
