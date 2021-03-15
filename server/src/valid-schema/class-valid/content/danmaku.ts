import { IsArray, IsDefined, ArrayMinSize, MinLength, IsIn } from 'class-validator';
import { Types } from 'mongoose';
import { Type, Transform } from 'class-transformer';

import { myEnum } from '@/config';

import { arrayTransform, objectIdTransform } from '../util';

export class DanmakuQuery {
    @IsDefined()
    @Transform(objectIdTransform)
    videoId: Types.ObjectId;
}

export class DanmakuSubmit {
    @IsDefined()
    @Transform(objectIdTransform)
    videoId: Types.ObjectId;

    @IsDefined()
    msg: string;

    type: number;

    @IsDefined()
    pos: number;
}