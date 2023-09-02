import {
  IsArray,
  IsDefined,
  ArrayMinSize,
  MinLength,
  IsIn,
} from 'class-validator';
import { Types } from 'mongoose';
import { Type, Transform } from 'class-transformer';

import { myEnum } from '@/dev-config';
import { TransformMongoId } from '@/valid-schema/class-transformer';

import { arrayTransform } from '../util';

export class DanmakuQuery {
  @IsDefined()
  @TransformMongoId()
  videoId: Types.ObjectId;
}

export class DanmakuSubmit {
  @IsDefined()
  @TransformMongoId()
  videoId: Types.ObjectId;

  @IsDefined()
  msg: string;

  type: number;

  @IsDefined()
  pos: number;
}
