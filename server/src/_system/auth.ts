import * as config from '@/config';
import { AuthConfigType } from '@/config/authConfig';

import * as common from './common';

export type AuthType = AuthorityType | AuthorityType[] | AuthorityType[][];

type AuthorityType = string | AuthConfigType;
type UserType = {
    authority: { [key: string]: boolean }
};
export class Auth {
    isAccessable(user: UserType, auth: AuthType, opt?: IsExistsAuthorityOption) {
        let result = !auth
            || (Array.isArray(auth) && !auth.length)
            || Auth.includes(user, auth, opt);
        return result;
    }

    checkAccessable(user: UserType, auth: AuthType) {
        let opt: IsExistsAuthorityOption = {};
        let result = this.isAccessable(user, auth, opt);
        if (!result) {
            let errCode = Auth.getErrorCode(opt.notExistsAuthority);
            throw common.error('', errCode);
        }
    }

    static includes(user: UserType, authData: AuthType, opt?: IsExistsAuthorityOption) {
        if (!Array.isArray(authData))
            authData = [authData];
        for (let i = 0; i < authData.length; i++) {
            let item = authData[i];
            if (!Auth.contains(user, item, opt)) {
                return false;
            }
        }
        return true;
    }

    static contains(user: UserType, authData: AuthorityType | AuthorityType[], opt?: IsExistsAuthorityOption) {
        if (!Array.isArray(authData) && typeof authData != 'string')
            authData = authData.code;
        if (typeof authData == 'string')
            authData = authData.split(',');
        for (let i = 0; i < authData.length; i++) {
            let item = authData[i];
            if (typeof item != 'string')
                item = item.code;
            if (user.authority[item]) {
                if (opt) opt.notExistsAuthority = null;
                return true;
            }
            if (opt) {
                opt.notExistsAuthority = item;
            }
        }
        if (opt?.throwError) {
            throw common.error('', Auth.getErrorCode(opt.notExistsAuthority));
        }
        return false;
    }

    static getErrorCode(authData) {
        if (authData && config.auth[authData]?.errCode)
            return config.auth[authData].errCode;
        return config.error.NO_PERMISSIONS;
    }
}

type IsExistsAuthorityOption = {
    //output
    notExistsAuthority?: string;
    throwError?: boolean;
}