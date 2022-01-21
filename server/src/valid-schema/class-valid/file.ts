import { IsDefined } from 'class-validator';
import { Types } from 'mongoose';
import { Transform, Type } from 'class-transformer';
import { objectIdTransform } from './util';
import { ListBase, OperateBase } from './base';

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

export class FileList extends ListBase {
  @Type()
  hash: string
}

export class FileOperate extends OperateBase {}