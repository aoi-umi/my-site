import {
    getModelForClass, ModelType, DocType, InstanceType,
    setSchema, prop, arrayProp, getSchema
} from 'mongoose-ts-ua';
import { Types, SchemaTypes } from 'mongoose';
import * as Int32 from 'mongoose-int32';
import * as mathjs from 'mathjs';

import { myEnum } from '@/config';

import { Base } from '../_base';

export type RefundInstanceType = InstanceType<Refund>;
export type RefundModelType = ModelType<Refund, typeof Refund>;
export type RefundDocType = DocType<RefundInstanceType>;

@setSchema({
    schemaOptions: {
        toJSON: {
            virtuals: true
        }
    }
})
export class Refund extends Base {
    @prop({
        type: SchemaTypes.ObjectId,
        required: true
    })
    userId: Types.ObjectId;

    @prop()
    get orderNo() {
        //临时
        return this._id.toString();
    };

    @prop({
        required: true
    })
    payOrderNo: string;

    @prop({
        type: SchemaTypes.ObjectId,
    })
    assetLogId: Types.ObjectId;

    @prop({
        enum: myEnum.assetSourceType.getAllValue(),
        required: true,
    })
    type: number;

    @prop()
    get typeText() {
        return myEnum.assetSourceType.getKey(this.type);
    };

    @prop({
        enum: myEnum.payStatus.getAllValue(),
        default: myEnum.payRefundStatus.已申请,
    })
    status: number;

    @prop()
    get statusText() {
        return myEnum.payRefundStatus.getKey(this.status);
    };

    @prop()
    get money() {
        return mathjs.round(this.moneyCent / 100, 2) as number;
    }

    set money(val) {
        this.moneyCent = Math.round(val * 100);
    }

    @prop({
        type: Int32,
        required: true
    })
    moneyCent: number;
}

export const RefundModel = getModelForClass<Refund, typeof Refund>(Refund);

