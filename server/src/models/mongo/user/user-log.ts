import {
    getModelForClass, ModelType, DocType, InstanceType,
    setSchema, prop, arrayProp, setMethod
} from 'mongoose-ts-ua';
import { Types, SchemaTypes } from 'mongoose';

import { Base } from '../_base';

export type UserLogInstanceType = InstanceType<UserLog>;
export type UserLogModelType = ModelType<UserLog, typeof UserLog>;
export type UserLogDocType = DocType<UserLogInstanceType>;
@setSchema({
    schemaOptions: {
        toJSON: {
            virtuals: true
        }
    }
})
export class UserLog extends Base {
    @prop({
        required: true,
        type: SchemaTypes.ObjectId,
    })
    userId: Types.ObjectId;

    @prop({
        required: true,
        type: SchemaTypes.ObjectId,
    })
    operatorId: Types.ObjectId;

    @prop()
    operator: string;

    @prop()
    remark: string;

    @prop({
        type: Object
    })
    oldData: any;
}

export const UserLogModel = getModelForClass<UserLog, typeof UserLog>(UserLog);

