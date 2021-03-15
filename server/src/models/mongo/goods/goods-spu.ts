import {
    getModelForClass, ModelType, DocType, InstanceType,
    setSchema, prop, arrayProp, getSchema, setMethod, setPlugin
} from 'mongoose-ts-ua';
import { Types, SchemaTypes } from 'mongoose';

import { myEnum } from '@/config';

import { Base } from '../_base';
import { pagination, IPagination } from '../_plugins/pagination';
export type GoodsSpuInstanceType = InstanceType<GoodsSpu>;
export type GoodsSpuModelType = ModelType<GoodsSpu, typeof GoodsSpu>;
export type GoodsSpuDocType = DocType<GoodsSpuInstanceType>;

@setSchema({
    schemaOptions: {
        toJSON: { virtuals: true }
    }
})
@setPlugin(pagination)
export class GoodsSpu extends Base {
    @prop({
        required: true,
        type: SchemaTypes.ObjectId,
    })
    userId: Types.ObjectId;

    @prop({
        required: true,
    })
    name: string;

    @arrayProp({
        type: SchemaTypes.ObjectId
    })
    typeIds: Types.ObjectId[];

    @prop({
        required: true,
    })
    profile: string;

    @arrayProp({
        required: true,
        type: String,
        minlength: 1,
    })
    imgs: string[];

    @prop({
        required: true,
        enum: myEnum.goodsStatus.getAllValue(),
    })
    status: number;

    @prop()
    get statusText() {
        return myEnum.goodsStatus.getKey(this.status);
    }

    @prop()
    get canUpdate() {
        return [myEnum.goodsStatus.下架, myEnum.goodsStatus.上架].includes(this.status);
    }

    @prop()
    get canDel() {
        return ![myEnum.goodsStatus.已删除].includes(this.status);
    }

    //上架时间
    @prop({
        required: true
    })
    putOnAt: Date;

    //失效时间
    @prop()
    expireAt: Date;

    @setMethod
    canView() {
        let now = new Date().getTime();
        return this.status === myEnum.goodsStatus.上架 && this.putOnAt.getTime() <= now && (!this.expireAt || this.expireAt.getTime() > now);
    }
}

export const GoodsSpuModel = getModelForClass<GoodsSpu, typeof GoodsSpu & IPagination<GoodsSpu>>(GoodsSpu);