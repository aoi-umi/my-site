import {
  getModelForClass,
  ModelType,
  DocType,
  InstanceType,
  setSchema,
  prop,
  arrayProp,
  setPlugin,
} from 'mongoose-ts-ua';
import { Types, SchemaTypes } from 'mongoose';

import { myEnum } from '@/dev-config';

import { Base } from '../_base';
import { IVoteOwner } from '../vote';
import { pagination, IPagination } from '../_plugins/pagination';

export type CommentInstanceType = InstanceType<Comment>;
export type CommentModelType = ModelType<Comment, typeof Comment>;
export type CommentDocType = DocType<CommentInstanceType>;
@setSchema({
  schemaOptions: {
    toJSON: {
      virtuals: true,
    },
  },
})
@setPlugin(pagination)
export class Comment extends Base implements IVoteOwner {
  /**
   * 所属内容id
   */
  @prop({
    required: true,
    type: SchemaTypes.ObjectId,
  })
  ownerId: Types.ObjectId;

  @prop({
    required: true,
    type: SchemaTypes.ObjectId,
  })
  userId: Types.ObjectId;

  @prop({
    required: true,
    enum: myEnum.contentType.getAllValue(),
  })
  type: number;

  @prop({
    required: true,
    enum: myEnum.commentStatus.getAllValue(),
    default: myEnum.commentStatus.正常,
  })
  status: number;

  // 最顶层回复的id
  @prop({
    type: SchemaTypes.ObjectId,
  })
  topId: Types.ObjectId;

  @prop({
    type: SchemaTypes.ObjectId,
  })
  quoteId: Types.ObjectId;

  @prop({
    type: SchemaTypes.ObjectId,
  })
  quoteUserId: Types.ObjectId;

  @prop({
    required: true,
  })
  floor: number;

  @prop({
    required: true,
  })
  mainFloor: number;

  @prop()
  ip: string;

  @prop()
  comment: string;

  @prop({
    default: 0,
  })
  like: number;

  @prop({
    default: 0,
  })
  dislike: number;

  // 置顶
  @prop({
    default: false,
  })
  isSetAsTop: boolean;

  @prop()
  get canDel() {
    return this.status !== myEnum.commentStatus.已删除;
  }
}

export const CommentModel = getModelForClass<
  Comment,
  typeof Comment & IPagination<Comment>
>(Comment);
