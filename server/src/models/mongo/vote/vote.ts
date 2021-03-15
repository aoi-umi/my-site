import {
    getModelForClass, ModelType, DocType, InstanceType,
    setSchema, prop, arrayProp, getSchema
} from 'mongoose-ts-ua';
import { Types, SchemaTypes } from 'mongoose';

import { myEnum } from '@/config/enum';

import { Base } from '../_base';

export type VoteInstanceType = InstanceType<Vote>;
export type VoteModelType = ModelType<Vote, typeof Vote>;
export type VoteDocType = DocType<VoteInstanceType>;
@setSchema()
export class Vote extends Base {
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
        enum: myEnum.voteType.getAllValue()
    })
    type: number;

    @prop({
        required: true,
        enum: myEnum.voteValue.getAllValue()
    })
    value: number;
}

let schema = getSchema(Vote);
schema.index({ ownerId: 1, userId: 1 }, { unique: true });

export const VoteModel = getModelForClass<Vote, typeof Vote>(Vote);

export interface IVoteOwner {
    like: number;
    dislike: number;
}

