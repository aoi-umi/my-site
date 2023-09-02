import { IsDefined } from 'class-validator';
import { Types } from 'mongoose';
import { Transform, Type } from 'class-transformer';
import { ListBase, OperateBase } from './base';
import { TransformMongoId } from '../class-transformer';

export class FileGet {
  @IsDefined()
  @TransformMongoId()
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
  hash: string;
}

export class FileOperate extends OperateBase {}
