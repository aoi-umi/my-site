import { Type, Transform } from 'class-transformer';
import { Types } from 'mongoose';

import { objectIdTransform } from '@/valid-schema/class-valid/util';

export class LoginUser {
    isLogin: boolean;

    @Transform(objectIdTransform)
    _id: Types.ObjectId;
    nickname: string;
    account: string;
    avatar?: string;
    avatarUrl?: string;

    authority: { [key: string]: boolean };
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