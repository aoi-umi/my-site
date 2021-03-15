import * as SocketIO from 'socket.io';
import { Server } from 'http';

import * as config from '@/config';
import { myEnum } from '@/config';
import { MySocket } from '@/_system/socket';
import { Cache } from '@/_system/cache';

export let initSocket = function (server: Server, cache: Cache) {
    const io = SocketIO(server, { path: config.env.urlPrefix + '/socket.io' });
    let socket = new MySocket(io, (socket, mySocket) => {
        let { socketUser } = mySocket;

        let sessionId = mySocket.connect(socket, socket.request._query);

        socket.myData = {};
        socket.on(myEnum.socket.登录, (msg) => {
            socketUser.addUser(msg, socket);
        });
        socket.on(myEnum.socket.登出, (msg) => {
            socketUser.delUserBySocket(socket);
        });

        socket.on(myEnum.socket.弹幕池连接, (msg) => {
            socketUser.danmakuConn(msg.videoId, socket);
        });

        socket.on(myEnum.socket.弹幕池断开, (msg) => {
            socketUser.danmakuDisConn(msg.videoId, socket);
        });

        socket.on(myEnum.socket.授权, (msg) => {
            cache.setByCfg({
                ...config.dev.cache.wxAuth,
                key: msg.token
            }, sessionId);
        });

        socket.on(myEnum.socket.支付, (msg) => {
            cache.setByCfg({
                ...config.dev.cache.pay,
                key: msg.orderNo
            }, sessionId);
        });

        socket.on('disconnect', function () {
            mySocket.disconnect(socket);
        });
    });
    return socket;
};