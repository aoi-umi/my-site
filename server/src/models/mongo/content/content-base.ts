import {
    getModelForClass, ModelType, DocType, InstanceType,
    setSchema, prop, arrayProp, setPlugin
} from 'mongoose-ts-ua';
import { Types, SchemaTypes } from 'mongoose';

import { IVoteOwner } from '../vote';
import { Base } from '../_base/base';
import { IFavouriteOwner } from '../favourite';
import { pagination, IPagination } from '../_plugins/pagination';

export type ContentBaseInstanceType = InstanceType<ContentBase>;
export type ContentBaseDocType = DocType<ContentBaseInstanceType>;
export type ContentBaseModelType = ModelType<ContentBase, typeof ContentBase & IPagination<ContentBase>>;

@setSchema()
@setPlugin(pagination)
export abstract class ContentBase extends Base implements IVoteOwner, IFavouriteOwner {
    @prop({
        type: SchemaTypes.ObjectId,
        required: true,
    })
    userId: Types.ObjectId;

    @prop({
        default: ''
    })
    profile: string;

    @prop()
    cover: string;

    @prop({
        required: true,
    })
    title: string;

    abstract status: number;
    abstract get statusText(): string;

    @arrayProp({
        type: String
    })
    cate: string[];

    @prop({
        default: 0
    })
    readTimes: number;

    @prop({
        default: 0
    })
    commentCount: number;

    @prop({
        default: 0
    })
    like: number;

    @prop({
        default: 0
    })
    dislike: number;

    @prop({
        default: 0
    })
    favourite: number;

    @prop({
        default: ''
    })
    remark: string;

    @prop()
    setPublish: boolean;

    @prop()
    setPublishAt: Date;

    //发布时间
    @prop()
    publishAt: Date;

    abstract get canUpdate(): boolean;
    abstract get canDel(): boolean;
}