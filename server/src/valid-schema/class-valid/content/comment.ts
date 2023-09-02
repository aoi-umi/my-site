import { Transform, Type } from 'class-transformer';
import { IsDefined, MinLength, MaxLength, IsIn } from 'class-validator';
import { Types } from 'mongoose';

import { myEnum } from '@/dev-config';
import { ListBase, DelBase, UpdateBase } from '../base';
import { TransformMongoId } from '@/valid-schema/class-transformer';

export class CommentSubmit {
  @IsDefined()
  @TransformMongoId()
  ownerId: Types.ObjectId;

  @IsDefined()
  @MinLength(1)
  // @MaxLength(1024)
  comment: string;

  @TransformMongoId()
  quoteId: Types.ObjectId;

  @TransformMongoId()
  topId: Types.ObjectId;

  @IsDefined()
  @IsIn(myEnum.contentType.getAllValue())
  @Type()
  type: number;
}

export class CommentQuery extends ListBase {
  @IsDefined()
  @TransformMongoId()
  ownerId: Types.ObjectId;

  @Type()
  type: number;

  @TransformMongoId()
  topId?: Types.ObjectId;

  @Type()
  isHot?: boolean;
}

export class CommentDel extends DelBase {}

export class CommentSetAsTop extends UpdateBase {
  @IsDefined()
  @Type()
  isSetAsTop: boolean;
}
