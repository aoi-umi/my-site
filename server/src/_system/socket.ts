import { SocketOnConnect } from '@/typings/libs';
import { SocketUser } from '@/models/socket-user';
import { myEnum } from '@/config';
import * as config from '@/config';
import { cache } from '@/main';

export function tryFn(socket: Socket, fn: () => void) {
    try {
        fn();
    } catch (e) {
        console.error(e.message);
        socket.emit('err', e.message);
    }
}

type SocketMap = { [key: string]: Socket };
export class MySocket {
    io: SocketIO.Server;
    socketUser: SocketUser;
    allSocket: SocketMap = {};
    constructor(optIO: SocketIO.Server, onConnect?: SocketOnConnect) {
        this.io = optIO;
        this.socketUser = new SocketUser();
        this.io.on('connection', (socket: Socket) => {
            onConnect && onConnect(socket, this);
        });
    }

    async authRecv(token: string, data) {
        let cfg = config.dev.cache.wxAuth;
        let rs = await cache.getByCfg({
            ...cfg,
            key: token
        });
        if (!rs)
            return false;
        let socket = this.allSocket[rs];
        if (socket) {
            socket.emit(myEnum.socket.授权接收, data);
            cache.delByCfg(cfg);
            return true;
        }
        return false;
    }

    async payCallBack(orderNo: string) {
        let sessionId = await cache.getByCfg({
            ...config.dev.cache.pay,
            key: orderNo
        });
        if (sessionId) {
            this.allSocket[sessionId] && this.allSocket[sessionId].emit(myEnum.socket.支付回调, { orderNo });
        }
    }

    connect(socket: Socket, data) {
        let sessionId = data && data.sessionId;
        if (sessionId) {
            this.allSocket[sessionId] = socket;
        }
        return sessionId;
    }

    disconnect(socket: Socket) {
        for (let key in this.allSocket) {
            if (this.allSocket[key] === socket) {
                delete this.allSocket[key];
                break;
            }
        }
        this.socketUser.delUserBySocket(socket);
    }
}