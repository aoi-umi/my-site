import { Context } from 'koa';
import { RouterContext } from '@koa/router';
import { plainToClass } from 'class-transformer';

import * as config from '@/dev-config';
import { AuthType } from '@/_system/auth';
import { auth, cache } from '@/main';
import { logger } from '@/helpers';
import { UserMapper } from '@/models/mongo/user';
import { LoginUser } from '@/models/login-user';
import * as common from '@/_system/common';

export class UserAuthMid {
  static async getUser(
    token,
    opt?: {
      resetOpt?;
      autoLogin?: boolean;
    },
  ) {
    opt = { ...opt };
    let user = plainToClass(LoginUser, {
      _id: undefined,
      nickname: '',
      account: '',
      authority: {},
      isLogin: false,
      key: token || '',
    });
    if (token) {
      let userCacheCfg = {
        ...config.dev.cache.user,
        key: token,
      };
      let userData = await cache.getByCfg(userCacheCfg);
      if (userData) {
        user = plainToClass(LoginUser, userData);
        user.isLogin = true;

        let { disableResult, user: dbUser } = await UserMapper.accountCheck(
          user.account,
          user,
        );
        user.isDisabled = disableResult.disabled;

        //自动重新登录
        if (
          opt.autoLogin &&
          user.cacheAt &&
          user.cacheAt.getTime() <
            new Date().getTime() - 1000 * config.dev.autoLoginTime
        ) {
          try {
            let cacheUser = (user = await UserMapper.login(user.loginData, {
              resetOpt: opt.resetOpt,
              token,
              user: dbUser,
              oldData: user,
            }));
            await cache.setByCfg(userCacheCfg, cacheUser);
          } catch (e) {
            logger.error(e);
            cache.delByCfg(userCacheCfg);
          }
        }
      }
    }
    return user;
  }

  static normal(
    authData?: AuthType,
    opt?: {
      allowIfDisabled?: boolean;
    },
  ) {
    opt = {
      ...opt,
    };
    return async (ctx: Context & RouterContext, next) => {
      let tokenKey = config.dev.cache.user.prefix;
      let cookieToken = ctx.cookies.get(tokenKey);
      let token =
        ctx.query[tokenKey] || ctx.request.get(tokenKey) || cookieToken;
      let user = await UserAuthMid.getUser(token, {
        autoLogin: true,
        resetOpt: { imgHost: ctx.myData.imgHost },
      });
      ctx.myData.user = user;
      if (!cookieToken) {
        ctx.cookies.set(tokenKey, token);
      }
      if (user.isDisabled) {
        if (!opt.allowIfDisabled && ctx.method !== 'GET')
          throw common.error('账号已被禁用');
      }

      //url权限认证
      if (authData) auth.checkAccessable(user, authData);
      await next();
    };
  }
}
