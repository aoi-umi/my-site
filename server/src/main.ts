import * as Koa from 'koa';
import * as Router from '@koa/router';
import { ConfirmChannel } from 'amqplib';
import { Server } from 'http';
import { MQ } from 'amqplib-delay';

import * as config from '@/config';
import { MySocket } from '@/_system/socket';
import { Auth } from '@/_system/auth';
import { Cache } from '@/_system/cache';
import routes from '@/routes';
import { ThirdPartyPayMapper } from '@/3rd-party';
import * as helpers from '@/helpers';
import { initSocket } from '@/routes/socket';

import { PayMapper } from './models/mongo/asset';

export const auth = new Auth();
export const mq = new MQ();
export const cache = new Cache(config.env.redis.uri, config.env.cachePrefix || '');
export async function init(app: Koa) {

    await mq.connect(config.env.mq.mqUri);

    //创建重试延时队列
    await mq.ch.addSetup(async (ch: ConfirmChannel) => {
        return Promise.all([
            mq.createDelayQueue(ch)
        ]);
    });

    await mq.ch.addSetup(async (ch: ConfirmChannel) => {
        //支付通知处理
        let pnhCfg = config.dev.mq.payNotifyHandler;
        let payNotifyHandler = await MQ.delayTask(ch, pnhCfg);

        //自动取消订单
        let pacCfg = config.dev.mq.payAutoCancel;
        let payAutoCancel = await MQ.delayTask(ch, pacCfg);
        return Promise.all([
            ...payNotifyHandler,
            mq.consumeRetry(ch, pnhCfg.deadLetterQueue, async (content) => {
                await ThirdPartyPayMapper.notifyHandler(content);
            }),

            ...payAutoCancel,
            mq.consumeRetry(ch, pacCfg.deadLetterQueue, async (content) => {
                await PayMapper.cancel(content, { auto: true });
            }),
        ] as any);
    });
    register(app);
}

let register = function (app: Koa) {
    app.keys = ['some secret hurr'];

    app.use(async (ctx, next) => {
        await helpers.myRequestHandler(async (opt) => {
            opt.noSend = true;
            let ip = ctx.request.get('x-forwarded-for') || ctx.request.get('X-Real-IP') || ctx.ip;
            ctx.myData = {
                startTime: new Date().getTime(),
                ip,
                imgHost: ctx.headers.host,
                videoHost: ctx.headers.host,
            };
            await next();
            return ctx.body;
        }, ctx);
    });

    let route = new Router();
    route.get('/', async (ctx) => {
        ctx.body = {
            name: config.env.name,
            version: config.env.version,
        };
    });
    app.use(route.routes()).use(route.allowedMethods());
    app.use(routes.routes()).use(routes.allowedMethods());

    app.use(async (ctx, next) => {
        let err = new Error('Not Found');
        err['status'] = 404;
        ctx.status = 404;
        throw err;
    });
};

export var mySocket: MySocket = null;
export let initServer = function (server: Server) {
    mySocket = initSocket(server, cache);
};

