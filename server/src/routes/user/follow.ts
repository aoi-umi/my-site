
import { transaction } from '@/_system/dbMongo';
import { error } from '@/_system/common';
import { myEnum } from '@/config';
import { paramsValid } from '@/helpers';
import * as ValidSchema from '@/valid-schema/class-valid';
import { MyRequestHandler } from '@/middleware';

import { FollowMapper } from '@/models/mongo/follow';
import { UserModel, UserMapper } from '@/models/mongo/user';

export let save: MyRequestHandler = async (opt) => {
    let user = opt.myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.FollowSave);
    if (user.equalsId(data.userId)) {
        throw error('不能关注自己');
    }
    let detail = await FollowMapper.create({ userId: user._id, followUserId: data.userId });
    let { followEachOther } = await FollowMapper.isFollowEach({
        srcStatus: data.status,
        srcUserId: user._id,
        destUserId: data.userId
    });
    if (detail.status !== data.status) {
        let self = await UserModel.findById(user._id);
        let follow = await UserModel.findById(data.userId);
        let isFollowing = detail.status === myEnum.followStatus.已关注;
        let change = isFollowing ? -1 : 1;
        detail.status = data.status;
        await transaction(async (session) => {
            await detail.save({ session });
            await self.update({ following: self.following + change }, { session });
            await follow.update({ follower: follow.follower + change }, { session });
        });
    }

    return {
        status: data.status,
        followEachOther,
    };
};

export let query: MyRequestHandler = async (opt) => {
    let user = opt.myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.FollowQuery);
    let { rows, total } = await FollowMapper.query(data, { user, imgHost: opt.myData.imgHost });
    return {
        rows,
        total,
    };
};