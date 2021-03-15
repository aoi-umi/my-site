import {
    getModelForClass, ModelType, DocType, InstanceType,
    setSchema, prop, arrayProp, setMethod, setPlugin
} from 'mongoose-ts-ua';
import { Types, SchemaTypes } from 'mongoose';

import { myEnum } from '@/config';

import { Base } from '../_base';
import { pagination, IPagination } from '../_plugins/pagination';

export type ContentLogInstanceType = InstanceType<ContentLog>;
export type ContentLogModelType = ModelType<ContentLog, typeof ContentLog>;
export type ContentLogDocType = DocType<ContentLogInstanceType>;
@setSchema({
    schemaOptions: {
        toJSON: {
            virtuals: true
        }
    }
})
@setPlugin(pagination)
export class ContentLog extends Base {
    @prop({
        type: SchemaTypes.ObjectId,
        required: true,
    })
    userId: Types.ObjectId;

    @prop()
    logUser: string;

    @prop({
        required: true,
        enum: myEnum.contentType.getAllValue(),
    })
    contentType: string;

    @prop({
        type: SchemaTypes.ObjectId,
        required: true,
    })
    contentId: Types.ObjectId;

    @prop({
        required: true,
    })
    srcStatus: number;

    @prop({
        required: true,
    })
    destStatus: number;

    @setMethod
    getStatusText(status) {
        let map = {
            [myEnum.contentType.文章]: myEnum.articleStatus,
            [myEnum.contentType.视频]: myEnum.videoStatus,
        };
        return map[this.contentType].getKey(status);
    }

    @prop()
    get srcStatusText() {
        return this.getStatusText(this.srcStatus);
    }

    @prop()
    get destStatusText() {
        return this.getStatusText(this.destStatus);
    }

    @prop()
    remark: string;
}

export const ContentLogModel = getModelForClass<ContentLog, typeof ContentLog & IPagination<ContentLog>>(ContentLog);



