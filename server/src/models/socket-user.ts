import { UserAuthMid } from '@/middleware';
import { myEnum } from '@/config';
import * as config from '@/config';

export class SocketUser {
    user: {
        [userId: string]: Socket[]
    } = {};

    danmakuUser: {
        [videoId: string]: Socket[]
    } = {};

    private findSocket(list, socket) {
        let ret = {
            socketList: list,
            socketData: null as Socket,
            idx: -1
        };
        if (list) {
            let matchIdx = list.findIndex(ele => ele === socket);
            if (matchIdx > -1) {
                ret.idx = matchIdx;
                ret.socketData = list[matchIdx];
            }
        }
        return ret;
    }

    private findUser(socket: Socket) {
        let key = socket.myData.userId;
        let list = this.user[key];
        return this.findSocket(list, socket);
    }

    private findDanmakuUser(videoId, socket: Socket) {
        let list = this.danmakuUser[videoId];
        return this.findSocket(list, socket);
    }

    async addUser(data, socket: Socket) {
        let user = await UserAuthMid.getUser(data[config.dev.cache.user.prefix]);
        if (user.isLogin) {
            let key = user._id.toString();
            socket.myData.userId = key;
            if (!this.user[key])
                this.user[key] = [];
            let list = this.user[key];
            let match = list.find(ele => ele === socket);
            if (!match)
                list.push(socket);
        }
    }

    delUserBySocket(socket: Socket) {
        let rs = this.findUser(socket);
        if (rs.idx >= 0)
            rs.socketList.splice(rs.idx, 1);

    }

    sendChat(data) {
        let userId = data.destUserId;
        if (this.user[userId]) {
            for (let socketData of this.user[userId]) {
                socketData.emit(myEnum.socket.私信接收, data);
            }
        }
    }

    danmakuConn(videoId, socket: Socket) {
        let key = videoId;
        let rs = this.findDanmakuUser(key, socket);
        if (!rs.socketData) {
            let list = rs.socketList;
            if (!list)
                list = this.danmakuUser[key] = [];
            list.push(socket);
        }
    }

    danmakuDisConn(videoId, socket: Socket) {
        let key = videoId;
        let rs = this.findDanmakuUser(key, socket);
        if (rs.idx >= 0)
            rs.socketList.splice(rs.idx, 1);
    }

    danmakuBoardcast(videoId, data) {
        let list = this.danmakuUser[videoId];
        if (list) {
            list.forEach(ele => {
                ele.emit(config.myEnum.socket.弹幕接收, data);
            });
        }
    }
}