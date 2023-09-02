import { Transform, Type } from 'class-transformer';
import { IsDefined, MinLength, MaxLength, IsIn } from 'class-validator';
import { Types } from 'mongoose';
import { myEnum } from '@/dev-config';
import { TransformMongoId } from '@/valid-schema/class-transformer';
import { ListBase } from '../base';

export class FollowSave {
  @IsDefined()
  @TransformMongoId()
  userId: Types.ObjectId;

  @IsDefined()
  @IsIn([myEnum.followStatus.已关注, myEnum.followStatus.已取消])
  @Type()
  status: number;
}

export class FollowQuery extends ListBase {
  @IsDefined()
  @IsIn(myEnum.followQueryType.getAllValue())
  @Type()
  type: number;

  anyKey: string;

  @IsDefined()
  @TransformMongoId()
  userId: Types.ObjectId;
}
