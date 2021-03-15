import { Transform, Type } from 'class-transformer';
import { IsDefined, MinLength, MaxLength, IsIn } from 'class-validator';
import { Types } from 'mongoose';
import { myEnum } from '@/config';
import { ListBase } from '../base';
import { objectIdTransform } from '../util';

export class FollowSave {
    @IsDefined()
    @Transform(objectIdTransform)
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
    @Transform(objectIdTransform)
    userId: Types.ObjectId;
}