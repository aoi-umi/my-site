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

import { Base } from '../_base';
import { pagination, IPagination } from '../_plugins/pagination';

type contentContact = typeof ContentContactBase & IPagination<ContentContactBase>;
export type ContentContactBaseInstanceType = InstanceType<ContentContactBase>;
export type ContentContactBaseModelType = ModelType<ContentContactBase, contentContact>;
export type ContentContactBaseDocType = DocType<ContentContactBaseInstanceType>;

//与内容关联的类
@setSchema()
@setPlugin(pagination)
export class ContentContactBase extends Base {
    @prop({
        required: true,
        type: SchemaTypes.ObjectId,
    })
    userId: Types.ObjectId;

    @prop({
        required: true,
        type: SchemaTypes.ObjectId,
    })
    ownerId: Types.ObjectId;

    @prop({
        required: true,
        enum: myEnum.contentType.getAllValue(),
    })
    type: number;
}