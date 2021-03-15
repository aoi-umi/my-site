import { Model, InstanceType } from 'mongoose-ts-ua';
import { Types } from 'mongoose';

import { myEnum } from '@/config';
import * as config from '@/config';
import { error } from '@/_system/common';

import { ArticleMapper, ArticleModel } from '../article';
import { VideoModel } from '../video';
import { CommentModel } from '../comment';
import { IVoteOwner, VoteModel } from './vote';

export class VoteMapper {
    static async create(opt: {
        ownerId,
        userId,
        type,
    }) {
        let vote = await VoteModel.findOne({ ownerId: opt.ownerId, userId: opt.userId });
        if (!vote) {
            vote = new VoteModel({
                ownerId: opt.ownerId,
                userId: opt.userId,
                type: opt.type,
                value: myEnum.voteValue.无
            });
        }
        return vote;
    }

    static async findOwner(opt: {
        ownerId,
        type,
    }) {
        let owner: InstanceType<IVoteOwner>;
        if (opt.type == myEnum.voteType.文章) {
            owner = await ArticleModel.findOne({
                _id: opt.ownerId,
                status: myEnum.articleStatus.审核通过
            });
        } else if (opt.type == myEnum.voteType.视频) {
            owner = await VideoModel.findOne({
                _id: opt.ownerId,
                status: myEnum.videoStatus.审核通过
            });
        } else if (opt.type == myEnum.voteType.评论) {
            owner = await CommentModel.findOne({
                _id: opt.ownerId,
                status: myEnum.commentStatus.正常
            });
        }
        if (!owner)
            throw error('', config.error.NO_MATCH_DATA);
        return owner;
    }

    static lookupPipeline(opt: {
        userId: any;
        ownerIdKey?: string;
    }) {
        return [
            {
                $lookup: {
                    from: VoteModel.collection.collectionName,
                    let: { ownerId: '$' + (opt.ownerIdKey || '_id') },
                    pipeline: [{
                        $match: {
                            userId: Types.ObjectId(opt.userId),
                            $expr: { $eq: ['$$ownerId', '$ownerId'] }
                        }
                    }],
                    as: 'vote'
                }
            },
            { $unwind: { path: '$vote', preserveNullAndEmptyArrays: true } },
        ];
    }
}