import { IsDefined, MinLength, IsIn } from 'class-validator';
import { Types } from 'mongoose';
import { Type, Transform } from 'class-transformer';
import { TransformMongoId } from '@/valid-schema/class-transformer';

import { myEnum } from '@/dev-config';

import { ListBase, DelBase, DetailQueryBase, OperateBase } from '../base';

export class ContentQuery extends ListBase {
  @TransformMongoId()
  _id: Types.ObjectId;
  title: string;
  user: string;
  @TransformMongoId()
  userId: Types.ObjectId;
  anyKey: string;
  status: string;
}

export class ContentDetailQuery extends DetailQueryBase {}

export class ContentSave {
  @TransformMongoId()
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

export class ContentMgtAudit extends OperateBase {
  @IsDefined()
  @IsIn([myEnum.contentOperate.审核通过, myEnum.contentOperate.审核不通过])
  operate: string;

  remark: string;
}

export class ContentMgtRecovery extends OperateBase {}
