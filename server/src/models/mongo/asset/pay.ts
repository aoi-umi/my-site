import {
    getModelForClass, ModelType, DocType, InstanceType,
    setSchema, prop, arrayProp, getSchema, setPlugin
} from 'mongoose-ts-ua';
import { Types, SchemaTypes } from 'mongoose';
import * as Int32 from 'mongoose-int32';
import * as mathjs from 'mathjs';

import { myEnum } from '@/config';

import { Base } from '../_base';

export type PayInstanceType = InstanceType<Pay>;
export type PayModelType = ModelType<Pay, typeof Pay>;
export type PayDocType = DocType<PayInstanceType>;

import { pagination, IPagination } from '../_plugins/pagination';
@setSchema({
    schemaOptions: {
        toJSON: {
            virtuals: true
        }
    }
})
@setPlugin(pagination)
export class Pay extends Base {
    @prop()
    get orderNo() {
        //临时
        return this._id.toString();
    };

    @prop({
        type: SchemaTypes.ObjectId,
        required: true
    })
    userId: Types.ObjectId;

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
        enum: myEnum.payContactType.getAllValue(),
        required: true,
    })
    contactType: number;

    @prop()
    get contactTypeText() {
        return myEnum.payContactType.getKey(this.type);
    };

    @prop()
    contactObj: any;

    @prop()
    title: string;

    @prop()
    content: string;

    @prop({
        enum: myEnum.payStatus.getAllValue(),
        default: myEnum.payStatus.未支付,
    })
    status: number;

    @prop()
    get statusText() {
        return myEnum.payStatus.getKey(this.status);
    };

    @prop({
        enum: myEnum.payStatus.getAllValue(),
        default: myEnum.payRefundStatus.未退款,
    })
    refundStatus: number;

    @prop()
    get refundStatusText() {
        return myEnum.payRefundStatus.getKey(this.refundStatus);
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

    @prop({
        type: Int32,
        default: 0,
        validate: (val) => {
            return val >= 0;
        }
    })
    refundMoneyCent: number;

    @prop()
    get canPay() {
        return [myEnum.payStatus.未支付].includes(this.status);
    }

    @prop()
    get canCancel() {
        return [myEnum.payStatus.未支付].includes(this.status);
    }

    @prop()
    get canRefundApply() {
        return [myEnum.payStatus.已支付].includes(this.status) && [myEnum.payRefundStatus.未退款].includes(this.refundStatus);
    }

    @prop()
    get canRefund() {
        return [myEnum.payRefundStatus.已申请].includes(this.refundStatus);
    }
}

export const PayModel = getModelForClass<Pay, typeof Pay & IPagination<Pay>>(Pay);

