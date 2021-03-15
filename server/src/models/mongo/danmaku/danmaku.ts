import {
    getModelForClass, ModelType, DocType, InstanceType,
    setSchema, prop, arrayProp
} from 'mongoose-ts-ua';
import { Types, SchemaTypes } from 'mongoose';
import * as Int32 from 'mongoose-int32';

import { Base } from '../_base/base';
import { myEnum } from '@/config';

export type DanmakuInstanceType = InstanceType<Danmaku>;
export type DanmakuDocType = DocType<DanmakuInstanceType>;
export type DanmakuModelType = ModelType<Danmaku, typeof Danmaku>;

@setSchema()
export class Danmaku extends Base {
    @prop({
        type: SchemaTypes.ObjectId,
        required: true,
    })
    userId: Types.ObjectId;
    
    @prop({
        type: SchemaTypes.ObjectId,
        required: true,
    })
    videoId: Types.ObjectId;

    @prop({
        required: true,
    })
    msg: string;

    //位置,毫秒
    @prop({
        type: Int32,
        required: true,
    })
    pos: number;

    @prop()
    color: string;

    @prop({
        enum: myEnum.danmakuType.getAllValue(),
    })
    type: number;
}


export const DanmakuModel = getModelForClass<Danmaku, typeof Danmaku>(Danmaku);