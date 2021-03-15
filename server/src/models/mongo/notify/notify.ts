import {
    getModelForClass, ModelType, DocType, InstanceType,
    setSchema, prop, arrayProp, getSchema, setPlugin
} from 'mongoose-ts-ua';
import { Types, SchemaTypes } from 'mongoose';

import { myEnum } from '@/config';

import { Base } from '../_base';
import { pagination, IPagination } from '../_plugins/pagination';

export type NotifyInstanceType = InstanceType<Notify>;
export type NotifyModelType = ModelType<Notify, typeof Notify>;
export type NotifyDocType = DocType<NotifyInstanceType>;
@setSchema({
    schemaOptions: {
        toJSON: { virtuals: true }
    }
})
@setPlugin(pagination)
export class Notify extends Base {
    @prop({
        enum: myEnum.notifyType.getAllValue(),
        required: true,
    })
    type: number;

    @prop()
    get typeText() {
        return myEnum.notifyType.getKey(this.type);
    }

    @prop({
        required: true,
        index: { unique: true }
    })
    orderNo: string;

    @prop()
    outOrderNo: string;

    @prop({
        type: Object
    })
    value: any;

    @prop({
        type: Object
    })
    raw: any;
}

export const NotifyModel = getModelForClass<Notify, typeof Notify & IPagination<Notify>>(Notify);

