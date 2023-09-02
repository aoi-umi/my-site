import { Transform, Type } from 'class-transformer';
import { IsDefined, MinLength, MaxLength } from 'class-validator';
import { Types } from 'mongoose';
import { TransformMongoId } from '@/valid-schema/class-transformer';
import { ListBase } from '../base';

export class ChatSubmit {
  @IsDefined()
  @TransformMongoId()
  destUserId: Types.ObjectId;

  @IsDefined()
  @MinLength(1)
  content: string;
}

export class ChatQuery extends ListBase {
  @TransformMongoId()
  lastId: Types.ObjectId;

  @IsDefined()
  @TransformMongoId()
  destUserId: Types.ObjectId;
}

export class ChatList extends ListBase {}
