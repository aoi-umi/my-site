import { IsDefined } from 'class-validator';
import { Types } from 'mongoose';
import { Transform, Type } from 'class-transformer';
import { objectIdTransform } from './util';

export class FileGet {
    @IsDefined()
    @Transform(objectIdTransform)
    _id: Types.ObjectId;

    @Type()
    isRaw?: boolean;
}