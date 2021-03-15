import * as Koa from 'koa';
import * as moment from 'dayjs';
import { RouterContext } from '@koa/router';

import * as common from '@/_system/common';
import { logger } from '@/helpers';

import { StatUserMapper } from '@/models/mongo/statistics';
import { myEnum } from '@/config';

export class UserStatMid {
    static async stat(ctx: Koa.Context & RouterContext, next) {
        let uvKey = 'uv';
        let val = ctx.cookies.get(uvKey);
        if (!val) {
            val = common.guid();
        }
        ctx.cookies.set(uvKey, val, {
            maxAge: 86400 * 1000, // 最大存活时间
            httpOnly: false,
            overwrite: true,
            signed: true
        });
        //统计不影响next
        next();
        try {
            //uv ip 
            let ip = ctx.myData.ip;
            let uv = val;
            await StatUserMapper.create([
                { type: myEnum.statUserType.ip, val: ip },
                { type: myEnum.statUserType.uv, val: uv },
            ]);
        } catch (e) {
            logger.error(e);
        }
    }
}