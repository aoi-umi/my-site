import { Transform, Type } from 'class-transformer';
import {
  IsDefined,
  MinLength,
  MaxLength,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { Types } from 'mongoose';
import { myEnum } from '@/dev-config';
import { ListBase } from '../base';
import { ContentQuery } from './content';
import { TransformMongoId } from '@/valid-schema/class-transformer';

export class FavouriteSubmit {
  @IsDefined()
  @TransformMongoId()
  ownerId: Types.ObjectId;

  @IsDefined()
  @IsIn(myEnum.voteType.getAllValue())
  @Type()
  type: number;

  @IsDefined()
  @IsBoolean()
  @Type()
  favourite: boolean;
}

export class FavouriteQuery extends ContentQuery {}
