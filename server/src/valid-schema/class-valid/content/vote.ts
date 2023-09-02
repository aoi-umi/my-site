import { Transform, Type } from 'class-transformer';
import { IsDefined, MinLength, MaxLength, IsIn } from 'class-validator';
import { Types } from 'mongoose';
import { myEnum } from '@/dev-config';
import { TransformMongoId } from '@/valid-schema/class-transformer';

export class VoteSubmit {
  @IsDefined()
  @TransformMongoId()
  ownerId: Types.ObjectId;

  @IsDefined()
  @IsIn(myEnum.voteType.getAllValue())
  @Type()
  type: number;

  @IsDefined()
  @IsIn(myEnum.voteValue.getAllValue())
  @Type()
  value: number;
}
