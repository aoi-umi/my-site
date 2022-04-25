import { IsIn } from 'class-validator';

import { myEnum } from '@/dev-config';

import { OperateBase } from '../base';

export class ContentOperateBase extends OperateBase {
  @IsIn(myEnum.contentOperate.getAllValue())
  operate?: string;
}
