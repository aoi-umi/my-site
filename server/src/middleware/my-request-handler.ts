import { Context, Next } from 'koa';
import { RouterContext } from '@koa/router';
import { myRequestHandler } from '@/helpers';
import { MyData } from '@/typings/libs';

export type MyRequestHandlerOpt = {
    reqData?: any;
    reqOption?: any;
    myData?: MyData;
    json?: boolean;
    noSend?: boolean;
    sendAsFile?: boolean;
    originRes?: boolean;
}

export interface MyRequestHandler {
    (opt: MyRequestHandlerOpt, ctx?: Context, next?: Next): any;
}

export class MyRequestHandlerMid {
    static convert(fn: MyRequestHandler) {
        let rh = async (ctx: Context & RouterContext, next) => {
            let rs = await myRequestHandler(async (opt) => {
                opt.reqData = ctx.method === 'GET' ? ctx.request.query : ctx.request.body;
                opt.myData = ctx.myData;
                let rs = await fn(opt, ctx, next);
                return rs;
            }, ctx);
            return rs;
        };
        return rh;
    }
}