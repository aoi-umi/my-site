
//后端
import 'Koa';
import { LoginUser } from '../../models/login-user';

interface MyData {
    user?: LoginUser;
    autoSignIn?: boolean;
    noLog?: boolean;
    startTime: number;
    useStatus?: boolean;
    ip: string;
    lang?: string;
    imgHost?: string;
    videoHost?: string;
}
declare module 'koa' {
    interface DefaultContext {
        myData: MyData;
        _parsedUrl: {
            pathname: string;
        },
    }
}

import { MySocket } from '../../_system/socket';
type SocketOnConnect = (socket: Socket, mySocket: MySocket) => void;


import { Context } from 'koa';
import { Middleware } from '@koa/router';

export type RequestHandler = Middleware<any, Context>;