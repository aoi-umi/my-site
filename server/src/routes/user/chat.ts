import { RequestHandler } from 'express';

import { paramsValid } from '@/helpers';
import { error } from '@/_system/common';
import { mySocket } from '@/main';
import * as ValidSchema from '@/valid-schema/class-valid';
import { MyRequestHandler } from '@/middleware';

import { ChatModel, ChatMapper } from '@/models/mongo/chat';
import { BaseMapper } from '@/models/mongo/_base';
import { UserMapper } from '@/models/mongo/user';

export let submit: MyRequestHandler = async (opt) => {
    let user = opt.myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.ChatSubmit);
    if (user.equalsId(data.destUserId))
        throw error('不能私信自己');
    let chat = new ChatModel({
        ...data,
        userId: user._id,
    });
    await chat.save();
    mySocket.socketUser.sendChat(chat.toObject());
};

export let query: MyRequestHandler = async (opt) => {
    let user = opt.myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.ChatQuery);
    let rs = await ChatMapper.query(data, { userId: user._id, imgHost: opt.myData.imgHost });
    return {
        rows: rs.rows,
        total: rs.total,
    };
};

export let list: MyRequestHandler = async (opt) => {
    let user = opt.myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.ChatList);
    let userId = user._id;
    let rs = await ChatModel.aggregatePaginate([
        {
            $match: {
                $or: [{ 'destUserId': userId }, { 'userId': userId }]
            }
        },
        {
            $project: {
                key1: { $cond: [{ $eq: ['$userId', userId] }, '$userId', '$destUserId'] },
                key2: { $cond: [{ $ne: ['$userId', userId] }, '$userId', '$destUserId'] },
                data: '$$ROOT',
            }
        },
        { $group: { _id: { key1: '$key1', key2: '$key2' }, data: { $last: '$data' } } }
    ], {
        ...BaseMapper.getListOptions(data),
        extraPipeline: [
            //key2为对方id
            ...UserMapper.lookupPipeline({
                userIdKey: '_id.key2'
            })
        ]
    });
    let rows = rs.rows.map((ele: any) => {
        let obj = ele.data;
        UserMapper.resetDetail(ele.user, { imgHost: opt.myData.imgHost });
        obj.user = ele.user;
        return obj;
    });
    return {
        rows,
        total: rs.total,
    };
};