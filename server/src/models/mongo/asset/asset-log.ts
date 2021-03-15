import {
    getModelForClass, ModelType, DocType, InstanceType,
    setSchema, prop, arrayProp, getSchema, SubDocType, setPlugin
} from 'mongoose-ts-ua';
import { Types, SchemaTypes } from 'mongoose';
import * as Int32 from 'mongoose-int32';
import * as mathjs from 'mathjs';

import { myEnum } from '@/config';

import { Base } from '../_base';
import { pagination, IPagination } from '../_plugins/pagination';

export type AssetLogInstanceType = InstanceType<AssetLog>;
export type AssetLogModelType = ModelType<AssetLog, typeof AssetLog>;
export type AssetLogDocType = DocType<AssetLogInstanceType>;

@setSchema({
    schemaOptions: { _id: false }
})
class AssetLogRemark {
    @prop({
        type: SchemaTypes.ObjectId,
    })
    notifyId: Types.ObjectId;

    @prop()
    msg: string;

    @prop({
        default: Date.now
    })
    at: Date;
}

@setSchema({
    schemaOptions: {
        toJSON: {
            virtuals: true
        }
    }
})
@setPlugin(pagination)
export class AssetLog extends Base {

    @prop({
        enum: myEnum.assetType.getAllValue(),
        required: true,
    })
    type: number;

    @prop()
    get typeText() {
        return myEnum.assetType.getKey(this.type);
    }

    @prop({
        enum: myEnum.assetSourceType.getAllValue(),
        required: true,
    })
    sourceType: number;

    @prop()
    get sourceTypeText() {
        return myEnum.assetSourceType.getKey(this.sourceType);
    }

    @prop({
        enum: myEnum.assetLogStatus.getAllValue(),
        default: myEnum.assetLogStatus.未完成
    })
    status: number;

    @prop()
    get statusText() {
        return myEnum.assetLogStatus.getKey(this.status);
    }

    @prop({
        type: SchemaTypes.ObjectId,
        required: true,
    })
    orderId: Types.ObjectId;

    @prop()
    outOrderNo: string;

    @prop({
        required: true,
        index: { unique: true },
    })
    orderNo: string;

    @prop()
    get money() {
        return mathjs.round(this.moneyCent / 100, 2) as number;
    }

    @prop({
        type: Int32,
        required: true
    })
    moneyCent: number;

    @prop()
    req: string;

    @prop({
        type: SchemaTypes.ObjectId,
    })
    notifyId: Types.ObjectId;

    @prop()
    remark: string;

    @arrayProp({
        type: AssetLogRemark
    })
    remarkList: SubDocType<AssetLogRemark>[];
}

export const AssetLogModel = getModelForClass<AssetLog, typeof AssetLog & IPagination<AssetLog>>(AssetLog);

