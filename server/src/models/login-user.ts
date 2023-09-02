import { Type, Transform } from 'class-transformer';
import { Types } from 'mongoose';

import { TransformMongoId } from '@/valid-schema/class-transformer';

export class LoginUser {
  isLogin: boolean;
  isDisabled: boolean;

  @TransformMongoId()
  _id: Types.ObjectId;
  nickname: string;
  account: string;
  avatar?: string;
  avatarUrl?: string;

  authority: { [key: string]: any };
  key?: string;
  loginData?: any;

  @Type()
  cacheAt?: Date;

  nameToString() {
    return this.nickname + '(' + this.account + ')';
  }

  equalsId(id) {
    return this._id?.equals(id);
  }
}
