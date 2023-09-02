import { Type, Transform } from 'class-transformer';
import { IsIn, IsArray, IsDefined, ArrayMinSize, IsInt } from 'class-validator';
import { Types } from 'mongoose';
import { arrayTransform } from './util';
import { TransformMongoId } from '../class-transformer';

export class ListBase {
  @IsInt()
  @Type()
  page?: number;

  @IsInt()
  @Type()
  rows?: number;

  orderBy?: string;

  @IsIn([1, -1, 0])
  @Type()
  sortOrder?: number;

  @Type()
  getAll?: boolean;
}

export class DetailQueryBase {
  @IsDefined()
  @TransformMongoId()
  _id: Types.ObjectId;
}

export class UpdateBase {
  @IsDefined()
  @TransformMongoId()
  _id: Types.ObjectId;
}

export class OperateBase {
  @IsDefined()
  @IsArray()
  @ArrayMinSize(1)
  @Transform((value) => {
    return arrayTransform(value, Types.ObjectId);
  })
  idList: Types.ObjectId[];
}
export class DelBase extends OperateBase {}
