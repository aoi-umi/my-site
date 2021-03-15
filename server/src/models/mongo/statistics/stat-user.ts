import {
    getModelForClass, ModelType, DocType, InstanceType,
    setSchema, prop, arrayProp, setMethod
} from 'mongoose-ts-ua';

import { Base } from '../_base';
import { myEnum } from '@/config';

export type StatUserInstanceType = InstanceType<StatUser>;
export type StatUserModelType = ModelType<StatUser, typeof StatUser>;
export type StatUserDocType = DocType<StatUserInstanceType>;
@setSchema({
    schemaOptions: {
        toJSON: {
            virtuals: true
        }
    }
})
export class StatUser extends Base {
    //统计日期
    @prop({
        required: true
    })
    date: Date;

    @prop({
        enum: myEnum.statUserType.getAllValue(),
        required: true
    })
    type: string;

    @prop({
        required: true
    })
    val: string;

    @prop({
        default: 1
    })
    times: number;
}

export const StatUserModel = getModelForClass<StatUser, typeof StatUser>(StatUser);