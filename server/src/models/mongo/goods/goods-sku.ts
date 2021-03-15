import {
    getModelForClass, ModelType, DocType, InstanceType,
    setSchema, prop, arrayProp, getSchema
} from 'mongoose-ts-ua';
import { Types, SchemaTypes } from 'mongoose';

import { myEnum } from '@/config';

import { Base } from '../_base';
export type GoodsSkuInstanceType = InstanceType<GoodsSku>;
export type GoodsSkuModelType = ModelType<GoodsSku, typeof GoodsSku>;
export type GoodsSkuDocType = DocType<GoodsSkuInstanceType>;

@setSchema({
    schemaOptions: {
        toJSON: { virtuals: true }
    }
})
export class GoodsSku extends Base {
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
        type: String,
    })
    spec: string[];

    @prop({
        // required: true,
    })
    code: string;

    @prop({
        required: true,
        enum: myEnum.goodsSkuStatus.getAllValue(),
    })
    status: number;

    @prop({
        required: true
    })
    price: number;

    @prop({
        required: true
    })
    quantity: number;

    @prop({
        default: 0,
    })
    saleQuantity: number;

    @arrayProp({
        type: String,
    })
    imgs: string[];
}

export const GoodsSkuModel = getModelForClass<GoodsSku, typeof GoodsSku>(GoodsSku);
