
import * as common from '@/_system/common';
import { transaction } from '@/_system/dbMongo';
import { MyRequestHandler } from '@/middleware';
import { paramsValid, } from '@/helpers';
import { myEnum } from '@/config';
import * as config from '@/config';
import { cache } from '@/main';
import * as ValidSchema from '@/valid-schema/class-valid';

import { UserModel, UserMapper, UserLogMapper, UserDocType } from '@/models/mongo/user';
import { FileMapper } from '@/models/mongo/file';
import { LoginUser } from '@/models/login-user';
import { FollowModel, FollowInstanceType, FollowMapper } from '@/models/mongo/follow';
import { ThirdPartyAuthMapper } from '@/3rd-party';

function returnUser(user: LoginUser) {
    delete user.loginData;
    return user.key ? user : null;
}
export let info: MyRequestHandler = async (opt) => {
    let user = opt.myData.user;
    return returnUser(user);
};

export let detail: MyRequestHandler = async (opt) => {
    let user = opt.myData.user;
    let detail = await UserMapper.detail(user._id, { imgHost: opt.myData.imgHost });
    let dbUser = await UserModel.findById(user._id);
    UserMapper.resetDetail(detail, { imgHost: opt.myData.imgHost });
    await UserMapper.resetStat(dbUser, detail);
    return detail;

};

export let detailQuery: MyRequestHandler = async (opt) => {
    let user = opt.myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.UserDetailQuery);

    let detail = await UserModel.findById(data._id, { password: 0, roleList: 0, authorityList: 0 });
    if (!detail)
        throw common.error('', config.error.USER_NOT_FOUND);
    let obj = detail.toJSON({ virtuals: false }) as any;
    UserMapper.resetDetail(obj, { imgHost: opt.myData.imgHost });
    await UserMapper.resetStat(detail, obj);
    let follow: FollowInstanceType;
    obj.followEachOther = false;
    obj.followStatus = myEnum.followStatus.未关注;
    if (user.isLogin) {
        follow = await FollowModel.findOne({ userId: user._id, followUserId: detail._id } as any);
        if (follow) {
            let { followEachOther } = await FollowMapper.isFollowEach({
                srcStatus: follow.status,
                srcUserId: user._id,
                destUserId: follow.followUserId
            });
            obj.followEachOther = followEachOther;
            obj.followStatus = follow.status;
        }
    }
    return obj;

};

export let update: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.UserUpdate);
    let user = opt.myData.user;
    let updateCache: any = common.getDataInKey(data, ['avatar', 'nickname', 'profile']);
    let update = { ...updateCache };
    let dbUser = await UserModel.findById(user._id);
    if (data.newPassword) {
        UserMapper.checkToken(data, dbUser);
        update.password = UserMapper.encryptPwd(data.newPassword);
    }
    let log = UserLogMapper.create(dbUser, user, { update });
    await transaction(async (session) => {
        await dbUser.update(update, { session });
        await log.save({ session });
    });
    if (updateCache.avatar)
        updateCache.avatarUrl = FileMapper.getImgUrl(updateCache.avatar, opt.myData.imgHost);

    if (!common.isObjectEmpty(updateCache)) {
        for (let key in updateCache) {
            user[key] = updateCache[key];
        }
        await cache.setByCfg({
            ...config.dev.cache.user,
            key: user.key,
        }, user);
    }
    return updateCache;

};

export let unbind: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.UserUnbind);
    let user = opt.myData.user;
    let dbUser = await UserModel.findById(user._id);
    UserMapper.checkToken(data, dbUser);
    let update: UserDocType = {};
    if (data.type === myEnum.userBind.微信) {
        update.wxOpenId = '';
    }
    await dbUser.update(update);
};

export let bind: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.UserBind);
    let userByRs = await ThirdPartyAuthMapper.userByHandler({ by: data.by, val: data.val }, { checkExists: true });
    let user = opt.myData.user;
    let dbUser = await UserModel.findById(user._id);
    let update: UserDocType = {};
    update[userByRs.saveKey] = userByRs.val;
    await dbUser.update(update);
};

export let mgtQuery: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.UserMgtQuery);
    let { rows, total } = await UserMapper.query({
        ...data, includeDelAuth: true
    }, { imgHost: opt.myData.imgHost });
    rows.forEach(detail => {
        UserMapper.resetDetail(detail, { imgHost: opt.myData.imgHost });
    });
    return {
        rows,
        total
    };

};

export let mgtSave: MyRequestHandler = async (opt) => {
    let user = opt.myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.UserMgtSave);
    let detail = await UserModel.findById(data._id);
    if (!detail.canEdit)
        throw common.error('不可修改此账号');
    let update: any = {};

    let remark = '';
    if (data.delAuthList?.length) {
        detail.authorityList = detail.authorityList.filter(ele => !data.delAuthList.includes(ele));
        remark += `[删除了权限:${data.delAuthList.join(',')}]`;
    }
    if (data.delRoleList?.length) {
        detail.roleList = detail.roleList.filter(ele => !data.delRoleList.includes(ele));
        remark += `[删除了角色:${data.delRoleList.join(',')}]`;
    }

    if (data.addAuthList?.length) {
        detail.authorityList = [...detail.authorityList, ...data.addAuthList];
        remark += `[增加了权限:${data.addAuthList.join(',')}]`;
    }
    if (data.addRoleList?.length) {
        detail.roleList = [...detail.roleList, ...data.addRoleList];
        remark += `[增加了角色:${data.addRoleList.join(',')}]`;
    }
    update.authorityList = detail.authorityList;
    update.roleList = detail.roleList;

    if (data.password) {
        update.password = UserMapper.encryptPwd(data.password);
        remark += `[修改了密码, 原密码: ${detail.password}]`;
    }

    let log = UserLogMapper.create(detail, user, { remark });
    await transaction(async (session) => {
        await detail.update(update, { session });
        await log.save({ session });
    });
    return {
        _id: detail._id,
    };

};

export let mgtDisable: MyRequestHandler = async (opt) => {
    let user = opt.myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.UserMgtDisable);
    let detail = await UserModel.findById(data._id);
    if (!detail.canEdit)
        throw common.error('不可禁用此账号');
    let update: any = {};
    let remark = '封禁';
    if (data.disabled) {
        if (data.disabledTo) {
            update.disabledTo = data.disabledTo;
            remark += '至' + data.disabledTo;
        } else {
            update.status = myEnum.userStatus.禁用;
            remark += '永久';
        }
    } else {
        remark = '解封';
        update.$unset = {
            disabledTo: 1
        };
        update.status = myEnum.userStatus.正常;
    }

    let log = UserLogMapper.create(detail, user, { remark });
    await transaction(async (session) => {
        await detail.update(update, { session });
        await log.save({ session });
    });
    return {
        _id: detail._id,
    };

};