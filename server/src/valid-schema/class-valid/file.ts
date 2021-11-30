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

export class FileUploadCheck {
    @IsDefined()
    @Type()
    fileSize: number;

    @IsDefined()
    hash: string;

    @IsDefined()
    filename: string;
    
    @IsDefined()
    contentType: string;

    @IsDefined()
    @Type()
    chunkSize: number;
}