import { Transform, Type } from 'class-transformer';
import { IsDefined, MinLength, MaxLength, IsIn, IsBoolean } from 'class-validator';
import { Types } from 'mongoose';
import { myEnum } from '@/config';
import { objectIdTransform } from '../util';
import { ListBase } from '../base';
import { ContentQuery } from './content';

export class FavouriteSubmit {
    @IsDefined()
    @Transform(objectIdTransform)
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

export class FavouriteQuery extends ContentQuery {
}