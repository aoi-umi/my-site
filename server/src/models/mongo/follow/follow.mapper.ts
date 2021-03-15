import { Types } from 'mongoose';

import { myEnum } from '@/config';
import * as ValidSchema from '@/valid-schema/class-valid';
import { escapeRegExp } from '@/_system/common';

import { LoginUser } from '../../login-user';
import { UserMapper } from '../user';
import { BaseMapper } from '../_base';
import { FileMapper } from '../file';
import { FollowModel } from './follow';

export class FollowMapper {
    static async create(opt: {
        userId,
        followUserId,
    }) {
        let follow = await FollowModel.findOne({ userId: opt.userId, followUserId: opt.followUserId });
        if (!follow) {
            follow = new FollowModel({
                userId: opt.userId,
                followUserId: opt.followUserId,
                status: myEnum.followStatus.未关注,
            });
        }
        return follow;
    }

    static lookupPipeline(opt: {
        userId: any;
        userIdKey?: string;
    }) {
        return [
            {
                $lookup: {
                    from: FollowModel.collection.collectionName,
                    let: { followUserId: '$' + (opt.userIdKey || 'userId') },
                    pipeline: [{
                        $match: {
                            userId: Types.ObjectId(opt.userId),
                            $expr: { $eq: ['$$followUserId', '$followUserId'] }
                        }
                    }],
                    as: 'follow'
                }
            },
            { $unwind: { path: '$follow', preserveNullAndEmptyArrays: true } },
        ];
    }

    static async isFollowEach(data: {
        srcStatus: number,
        srcUserId: any,
        destUserId: any
    }) {
        let destFollow = await FollowModel.findOne({ userId: data.destUserId, followUserId: data.srcUserId });
        let followEachOther = destFollow?.status === myEnum.followStatus.已关注 && data.srcStatus === myEnum.followStatus.已关注;
        return {
            destFollow,
            followEachOther
        };
    }

    static async query(data: ValidSchema.FollowQuery, opt: { user: LoginUser, imgHost?: string }) {
        let { user } = opt;
        let cond: any = {
            status: myEnum.followStatus.已关注
        };
        let userId = data.userId;
        let userIdKey = '';
        let asName = '';
        if (data.type == myEnum.followQueryType.关注) {
            cond.userId = userId;
            userIdKey = 'followUserId';
            asName = 'followingUser';
        } else {
            cond.followUserId = userId;
            userIdKey = 'userId';
            asName = 'followerUser';
        }
        let userMatch;
        if (data.anyKey) {
            let anyKey = new RegExp(escapeRegExp(data.anyKey), 'i');
            userMatch = {
                $or: [
                    { account: anyKey },
                    { nickname: anyKey },
                    { profile: anyKey },
                ]
            };
        }

        let pipeline: any[] = [
            { $match: cond },
            ...UserMapper.lookupPipeline({
                userIdKey,
                match: userMatch,
                project: {
                    profile: 1
                }
            }),
        ];
        if (user.equalsId(data.userId)) {
            pipeline = [
                ...pipeline,
                //获取相互关注状态
                {
                    $lookup: {
                        from: FollowModel.collection.collectionName,
                        let: { followUserId: '$followUserId', userId: '$userId' },
                        pipeline: [{
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$$followUserId', '$userId'] },
                                        { $eq: ['$$userId', '$followUserId'] }
                                    ]

                                }
                            }
                        }],
                        as: 'follow'
                    }
                },
                { $unwind: { path: '$follow', preserveNullAndEmptyArrays: true } },
            ];
        }
        let rs = await FollowModel.aggregatePaginate<{
            user: any,
            follow: any,
        }>(pipeline, {
            ...BaseMapper.getListOptions(data),
        });
        let rows = rs.rows.map(detail => {
            detail.user.avatarUrl = FileMapper.getImgUrl(detail.user.avatar, opt.imgHost);
            detail[asName] = detail.user;
            let eachFollowStatus = detail.follow ? detail.follow.status : myEnum.followStatus.未关注;
            detail.user.followEachOther = eachFollowStatus === myEnum.followStatus.已关注;
            if (data.type == myEnum.followQueryType.关注) {
                detail.user.followStatus = detail.status;
            } else {
                detail.user.followStatus = eachFollowStatus;
            }
            UserMapper.resetDetail(detail.user, {
                imgHost: opt.imgHost
            });
            delete detail.user;
            delete detail.follow;
            return detail;
        });
        return {
            ...rs,
            rows
        };
    }
}