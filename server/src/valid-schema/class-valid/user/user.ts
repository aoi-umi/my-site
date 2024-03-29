import {
  IsArray,
  IsDefined,
  ArrayMinSize,
  MinLength,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { myEnum } from '@/dev-config';
import { TransformMongoId } from '@/valid-schema/class-transformer';

import { ListBase, DelBase, DetailQueryBase } from '../base';
export class UserAccountExists {
  @IsDefined()
  @MinLength(1)
  val: string;

  @IsIn(myEnum.userBy.getAllValue())
  by?: string;
}

export class UserSignUp {
  @IsDefined()
  nickname: string;

  @IsDefined()
  account: string;

  @IsDefined()
  password: string;

  @IsIn(myEnum.userBy.getAllValue())
  by?: string;

  byVal?: string;

  oauthToken?: string;
}

export class UserSignIn {
  @IsDefined()
  account: string;

  @IsDefined()
  rand: string;
}

export class UserSignInByAuth {
  @IsIn(myEnum.userBy.getAllValue())
  @IsDefined()
  by: string;

  @IsDefined()
  val: string;
}

export class UserOauth {
  @IsDefined()
  code: string;
}
export class UserOauthSignIn extends UserOauth {}
export class UserOauthBind extends UserOauth {}

export class UserUpdate {
  newPassword: string;

  rand: string;

  token: string;
}

export class UserLogQuery extends ListBase {
  userId: any;
}
export class UserUnbind {
  @IsIn(myEnum.oauthName.getAllValue())
  @IsDefined()
  type: string;

  @IsIn(myEnum.oauthName.getAllValue())
  oauthName: string;

  @IsDefined()
  rand: string;

  @IsDefined()
  token: string;
}

export class UserBind {
  @IsIn(myEnum.userBy.getAllValue())
  @IsDefined()
  by: string;

  @IsDefined()
  val: string;
}

export class UserDetailQuery extends DetailQueryBase {}

export class UserMgtQuery extends ListBase {
  @TransformMongoId()
  _id?: string;
  account?: string;
  nickname?: string;
  authority?: string;
  role?: string;
  anyKey?: string;

  @Type()
  //包含已删除的权限角色
  includeDelAuth?: boolean;
}

export class UserMgtSave {
  @IsDefined()
  @TransformMongoId()
  _id: string;

  @IsArray()
  delAuthList?: string[];

  @IsArray()
  addAuthList?: string[];

  @IsArray()
  delRoleList?: string[];

  @IsArray()
  addRoleList?: string[];

  password?: string;
}

export class UserMgtDisable {
  @IsDefined()
  @TransformMongoId()
  _id: string;

  @Type()
  disabled?: boolean;

  //disabled为true, 不传时为永封
  disabledTo?: string;
}
