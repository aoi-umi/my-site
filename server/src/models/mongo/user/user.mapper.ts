import { Types } from 'mongoose';
import { plainToClass } from 'class-transformer';

import { escapeRegExp } from '@/_system/common';
import * as common from '@/_system/common';
import { myEnum } from '@/config/enum';
import * as config from '@/config';
import * as ValidSchema from '@/valid-schema/class-valid';

import { LoginUser } from '../../login-user';
import { AuthorityModel } from '../authority';
import { RoleModel } from '../role';
import { BaseMapper } from '../_base';
import { FileMapper } from '../file';
import { FollowModel, FollowDocType } from '../follow';
import { ArticleModel } from '../article';
import { UserLogModel } from './user-log';
import { UserDocType, UserModel, UserInstanceType } from './user';
import { VideoModel } from '../video';

export type UserResetOption = {
    imgHost?: string;
};
export class UserMapper {
    static createToken(data, user: UserInstanceType) {
        let dataStr = JSON.stringify(data);
        let checkToken = common.md5(user.account + user.password + dataStr);
        return { dataStr, checkToken };
    }

    static checkToken(data: { token: string }, user: UserInstanceType) {
        let { token, ...restData } = data;
        let { checkToken } = UserMapper.createToken(restData, user);
        if (token !== checkToken)
            throw common.error('', config.error.TOKEN_WRONG);
    }

    static encryptPwd(pwd: string) {
        return common.md5(pwd);
    }

    static async accountExists(val: string, by?: string) {
        let opt: any = {};
        if (by === myEnum.userBy.微信授权) {
            opt.wxOpenId = val;
        } else {
            opt.account = val;
        }
        let rs = await UserModel.findOne(opt);
        return rs;
    }

    static async query(data: ValidSchema.UserMgtQuery, opt: UserResetOption) {
        let query: any = {};
        let noTotal = false;
        if (data._id) {
            query._id = Types.ObjectId(data._id);
            noTotal = true;
        }

        if (data.nickname)
            query.nickname = new RegExp(escapeRegExp(data.nickname), 'i');
        if (data.account)
            query.account = new RegExp(escapeRegExp(data.account), 'i');

        let query2: any = {};
        let and2 = [];
        if (data.anyKey) {
            let anykey = new RegExp(escapeRegExp(data.anyKey), 'i');
            and2 = [...and2, {
                $or: [
                    { nickname: anykey },
                    { account: anykey },
                    { 'authorityList': anykey },
                    { 'newAuthorityList.code': anykey },
                    { 'newAuthorityList.name': anykey },
                    { 'newRoleList.code': anykey },
                    { 'newRoleList.name': anykey },
                ]
            }];
        }
        if (data.role) {
            let role = new RegExp(escapeRegExp(data.role), 'i');
            and2 = [...and2, {
                $or: [
                    { 'roleList': role },
                    { 'newRoleList.code': role },
                    { 'newRoleList.name': role },
                ]
            }];
        }
        if (data.authority) {
            let authority = new RegExp(escapeRegExp(data.authority), 'i');
            and2 = [...and2, {
                $or: [
                    { 'authorityList': authority },
                    { 'newAuthorityList.code': authority },
                    { 'newAuthorityList.name': authority },
                ]
            }];
        }
        if (and2.length)
            query2.$and = and2;

        let authProject = {
            name: 1,
            code: 1,
            status: 1,
        };
        let pipeline: any[] = [
            {
                $match: query,
            },
            {
                $project: {
                    password: 0
                }
            },
            {
                $lookup: {
                    from: AuthorityModel.collection.collectionName,
                    let: {
                        authorityList: '$authorityList'
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $in: ['$code', '$$authorityList'] }
                            }
                        },
                        {
                            $project: authProject
                        }
                    ],
                    as: 'newAuthorityList'
                }
            },
            {
                $lookup: {
                    from: RoleModel.collection.collectionName,
                    let: {
                        roleList: '$roleList'
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $in: ['$code', '$$roleList'] }
                            }
                        },
                        {
                            $lookup: {
                                from: AuthorityModel.collection.collectionName,
                                let: {
                                    authorityList: '$authorityList'
                                },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: { $in: ['$code', '$$authorityList'] }
                                        }
                                    },
                                    {
                                        $project: authProject
                                    }
                                ],
                                as: 'newAuthorityList'
                            }
                        },
                        {
                            $project: {
                                name: 1,
                                code: 1,
                                status: 1,
                                authorityList: 1,
                                newAuthorityList: 1,
                            }
                        }
                    ],
                    as: 'newRoleList'
                }
            },
            {
                $match: query2,
            },
        ];
        let rs = await UserModel.aggregatePaginate<{
            newAuthorityList: any[],
            newRoleList: any[],
        }>(pipeline, {
            noTotal,
            ...BaseMapper.getListOptions(data),
        });
        let rows = rs.rows.map((ele) => {
            let model = new UserModel(ele);
            let obj = model.toJSON() as any;
            delete obj.wxOpenId;
            //可用权限
            let auth = {};
            let authorityList = ele.newAuthorityList;
            authorityList.forEach(authority => {
                if (authority.status == myEnum.authorityStatus.启用)
                    auth[authority.code] = authority;
            });
            if (data.includeDelAuth) {
                UserMapper.setDelAuthOrRole(authorityList, ele.authorityList);
            }
            obj.authorityList = authorityList;

            let roleList = ele.newRoleList;
            roleList.forEach(role => {
                if (role.status == myEnum.roleStatus.启用) {
                    let roleAuthorityList = role.newAuthorityList;
                    delete role.newAuthorityList;
                    roleAuthorityList.forEach(authority => {
                        if (authority.status == myEnum.authorityStatus.启用)
                            auth[authority.code] = authority;
                    });

                    if (data.includeDelAuth) {
                        UserMapper.setDelAuthOrRole(roleAuthorityList, role.authorityList);
                    }
                    role.authorityList = roleAuthorityList;
                }
            });
            if (data.includeDelAuth) {
                UserMapper.setDelAuthOrRole(roleList, ele.roleList);
            }
            obj.roleList = roleList;
            obj.auth = auth;

            let disRs = model.checkDisabled();
            obj.disabled = disRs.disabled;
            UserMapper.resetDetail(obj, opt);
            return obj;
        });
        return {
            ...rs,
            rows,
        };
    }

    static setDelAuthOrRole(list, codeList) {
        codeList.forEach(auth => {
            if (!list.find(e => e.code == auth)) {
                list.push({
                    code: auth,
                    isDel: true
                });
            }
        });
    }

    static async detail(_id, opt: UserResetOption) {
        let userRs = await UserMapper.query({ _id }, opt);
        let userDetail = userRs.rows[0];
        if (userDetail?.roleList.find(r => r.code == config.dev.rootRole)) {
            let authList = await AuthorityModel.find({ status: myEnum.authorityStatus.启用 });
            authList.forEach(ele => {
                userDetail.auth[ele.code] = ele;
            });
        }
        return userDetail;
    }

    static async accountCheck(account: string, loginUser?: LoginUser) {
        let user = await UserMapper.accountExists(account);
        if (!user)
            throw common.error('账号不存在');
        let disRs = user.checkDisabled();
        if (loginUser?.loginData) {
            let { checkToken } = UserMapper.createToken(loginUser.loginData, user);
            if (checkToken !== loginUser.key) {
                throw common.error('账号的密码已变更, 请重新登录');
            }
        }
        return {
            user,
            disableResult: disRs
        };
    }

    static async login(data: ValidSchema.UserSignIn, opt: {
        disabled: boolean,
        resetOpt: UserResetOption,
        user: UserInstanceType,
        token,
        oldData?: any,
        noPwd?: boolean,
    }) {
        let { token, disabled, user } = opt;
        let { checkToken } = UserMapper.createToken(data, user);
        if (!opt.noPwd) {
            if (token !== checkToken)
                throw common.error('', config.error.TOKEN_WRONG);
        }
        let userAuth = {
            [config.auth.login.code]: 1
        };
        if (!disabled) {
            let userDetail = await UserMapper.detail(user._id, opt.resetOpt);
            for (let key in userDetail.auth) {
                userAuth[key] = 1;
            }
        }

        let lastLoginAt = (opt.oldData?.lastLoginAt) || new Date();
        let rtn = {
            _id: user._id, account: user.account, nickname: user.nickname, avatar: user.avatar,
            key: checkToken, authority: userAuth,
            loginData: data,
            cacheAt: new Date(),
            lastLoginAt
        };
        UserMapper.resetDetail(rtn, opt.resetOpt);
        return plainToClass(LoginUser, rtn);
    }

    static resetDetail(detail, opt: UserResetOption) {
        opt = {
            ...opt
        };
        detail.avatarUrl = FileMapper.getImgUrl(detail.avatar, opt.imgHost);
    }

    static async resetStat(detail: UserInstanceType, obj: any) {
        let contentMatch = {
            userId: detail._id,
            publishAt: { $lte: new Date() }
        };
        //实时查数据
        let [
            following,
            follower,
            article,
            video,
        ] = await Promise.all([
            FollowModel.countDocuments({ userId: detail._id, status: myEnum.followStatus.已关注 }),
            FollowModel.countDocuments({ followUserId: detail._id, status: myEnum.followStatus.已关注 }),
            ArticleModel.countDocuments({
                ...contentMatch,
                status: myEnum.articleStatus.审核通过,
            }),
            VideoModel.countDocuments({
                ...contentMatch,
                status: myEnum.videoStatus.审核通过,
            })
        ]);
        obj.following = following;
        obj.follower = follower;
        obj.article = article;
        obj.video = video;
        let update = {};
        ['following', 'follower', 'article', 'video'].forEach(key => {
            if (obj[key] != detail[key]) {
                update[key] = obj[key];
            }
        });
        if (!common.isObjectEmpty(update)) {
            await detail.update(update);
        }
    }

    static lookupPipeline(opt?: {
        userIdKey?: string;
        asName?: string;
        match?: object;
        project?: object;
    }) {
        opt = {
            ...opt
        };
        let asName = opt.asName || 'user';
        return [
            {
                $lookup: {
                    from: UserModel.collection.collectionName,
                    let: { userId: '$' + (opt.userIdKey || 'userId') },
                    pipeline: [{
                        $match: {
                            ...opt.match,
                            $expr: { $eq: ['$$userId', '$_id'] }
                        }
                    }, {
                        $project: {
                            account: 1,
                            nickname: 1,
                            avatar: 1,
                            ...opt.project,
                        }
                    }],
                    as: asName
                }
            },
            { $unwind: '$' + asName },
        ];
    }

    static async queryById(userId, opt?: UserResetOption) {
        let list: (UserDocType & { avatarUrl?: string })[] = await UserModel.find({ _id: userId }, {
            account: 1,
            nickname: 1,
            avatar: 1,
        }).lean();
        list.forEach(ele => {
            UserMapper.resetDetail(ele, opt);
        });
        return list;
    }
}

export class UserLogMapper {
    static create(user: UserInstanceType, operator: LoginUser, opt: {
        remark?: string;
        update?: object;
    }) {
        let log = new UserLogModel({
            userId: user._id,
            operatorId: operator._id,
            operator: operator.nameToString()
        });
        let remark = opt.remark || '';
        if (!remark) {
            if (opt.update) {
                let updateKey = Object.keys(opt.update);
                remark += `[修改了:${updateKey}]`;
                log.oldData = {};
                updateKey.forEach(key => {
                    log.oldData[key] = user[key];
                });
            }
        }
        log.remark = remark;
        return log;
    }
}