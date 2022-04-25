import { IsDefined, MinLength } from 'class-validator';
import { Types } from 'mongoose';
import { Type, Transform } from 'class-transformer';

import { ListBase, DelBase, DetailQueryBase } from '../base';
import { objectIdTransform } from '../util';
import { ContentOperateBase } from './content-base';

export class ContentQuery extends ListBase {
  @Transform(objectIdTransform)
  _id: Types.ObjectId;
  title: string;
  user: string;
  @Transform(objectIdTransform)
  userId: Types.ObjectId;
  anyKey: string;
  status: string;
}

export class ContentDetailQuery extends DetailQueryBase {}

export class ContentSave {
  @Transform(objectIdTransform)
  _id?: Types.ObjectId;

  @IsDefined()
  @MinLength(1)
  title: string;

  @Type()
  submit?: boolean;
}

export class ContentDel extends DelBase {
  remark: string;
}

export class ContentMgtAudit extends ContentOperateBase {
  @IsDefined()
  @Type()
  status: number;

  remark: string;
}

export class ContentMgtRecovery extends ContentOperateBase {}
