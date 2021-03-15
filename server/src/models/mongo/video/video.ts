import {
    getModelForClass, ModelType, DocType, InstanceType,
    setSchema, prop, arrayProp
} from 'mongoose-ts-ua';
import { Types, SchemaTypes } from 'mongoose';

import { myEnum } from '@/config';
import { ContentBase } from '../content/content-base';
import { IPagination } from '../_plugins/pagination';

export type VideoInstanceType = InstanceType<Video>;
// export type VideoModelType = ModelType<Video, typeof Video>;
export type VideoDocType = DocType<VideoInstanceType>;
@setSchema({
    schemaOptions: {
        toJSON: {
            virtuals: true
        }
    }
})
export class Video extends ContentBase {
    @arrayProp({
        required: true,
        type: SchemaTypes.ObjectId
    })
    videoIdList: Types.ObjectId[];

    @prop({
        enum: myEnum.videoStatus.getAllValue()
    })
    status: number;

    @prop()
    get statusText() {
        return myEnum.videoStatus.getKey(this.status);
    }

    @prop()
    get canUpdate() {
        return [myEnum.videoStatus.草稿, myEnum.videoStatus.审核不通过].includes(this.status);
    }

    @prop()
    get canDel() {
        return ![myEnum.videoStatus.已删除].includes(this.status);
    }
}

export const VideoModel = getModelForClass<Video, typeof Video & IPagination<Video>>(Video);
export type VideoModelType = typeof VideoModel

