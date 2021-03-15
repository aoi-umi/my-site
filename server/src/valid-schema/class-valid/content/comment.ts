import { Transform, Type } from 'class-transformer';
import { IsDefined, MinLength, MaxLength, IsIn } from 'class-validator';
import { Types } from 'mongoose';

import { myEnum } from '@/config';
import { ListBase, DelBase } from '../base';
import { objectIdTransform } from '../util';

export class CommentSubmit {
    @IsDefined()
    @Transform(objectIdTransform)
    ownerId: Types.ObjectId;

    @IsDefined()
    @MinLength(1)
    // @MaxLength(1024)
    comment: string;

    @Transform(objectIdTransform)
    quoteId: Types.ObjectId;

    @Transform(objectIdTransform)
    topId: Types.ObjectId;

    @IsDefined()
    @IsIn(myEnum.contentType.getAllValue())
    @Type()
    type: number;
}

export class CommentQuery extends ListBase {
    @IsDefined()
    @Transform(objectIdTransform)
    ownerId: Types.ObjectId;

    @Type()
    type: number;

    @Transform(objectIdTransform)
    topId?: Types.ObjectId
}

export class CommentDel extends DelBase {
}