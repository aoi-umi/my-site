import { Types } from 'mongoose';

import * as ValidSchema from '@/valid-schema/class-valid';
import { Auth } from '@/_system/auth';
import * as common from '@/_system/common';
import * as config from '@/config';
import { myEnum } from '@/config';

import { LoginUser } from '../../login-user';
import { BaseMapper } from '../_base';
import { ContentBaseInstanceType } from '../content';
import { ArticleMapper } from '../article';
import { VideoMapper } from '../video';
import { UserModel, UserMapper, UserDocType, UserResetOption } from '../user';
import { VoteModel, VoteMapper, VoteInstanceType } from '../vote';
import { CommentModel, CommentDocType, CommentInstanceType } from './comment';

type CommentResetOption = {
    imgHost?: string;
    user?: LoginUser
    authorId?: Types.ObjectId;
    userList?: UserDocType[];
    voteList?: VoteInstanceType[];
};
export class CommentMapper {
    static async create(data: ValidSchema.CommentSubmit, type, user: LoginUser) {
        let lastComment = await CommentModel.findOne({ ownerId: data.ownerId }).sort({ floor: -1 });
        let quote: CommentInstanceType;
        if (data.quoteId)
            quote = await CommentModel.findById(data.quoteId);

        let obj: any = {
            userId: user._id,
            ownerId: data.ownerId,
            comment: data.comment,
            topId: data.topId,
            type: type,
            floor: lastComment ? lastComment.floor + 1 : 1
        };
        if (quote) {
            obj.quoteId = quote._id;
            obj.quoteUserId = quote.userId;
        }
        let comment = new CommentModel(obj);
        return comment;
    }

    static async query(data: ValidSchema.CommentQuery, opt: {
        resetOpt?: CommentResetOption,
    }) {
        let match: any;
        let getReply = true;
        if (data.topId) {
            match = { topId: data.topId };
            data.orderBy = '_id';
            data.sortOrder = 1;
            getReply = false;
        } else {
            match = {
                ownerId: data.ownerId,
                type: data.type,
                topId: { $exists: 0 }
            };
        }

        // let owner = await CommentMapper.findOwner({
        //     ownerId: data.ownerId,
        //     type: data.type,
        //     mgt: true,
        // });
        let pipeline: any[] = [
            {
                $match: match
            },
        ];
        let resetOpt = { ...opt.resetOpt };

        let rs = await CommentModel.aggregatePaginate(pipeline, {
            ...BaseMapper.getListOptions({
                ...data,
            }),
        });
        let commentList = rs.rows.map(ele => new CommentModel(ele));

        let quoteList = rs.rows.filter(ele => ele.quoteUserId);

        let replyList = [];
        //获取二级回复
        if (getReply) {
            replyList = await CommentMapper.childQuery({ replyTopId: commentList.map(ele => ele._id) });
        }

        //获取用户信息
        let allComment = [...commentList, ...replyList];
        let userIdList = common.distinct([
            ...allComment.map(ele => ele.userId),
            ...quoteList.map(ele => ele.quoteUserId)
        ], (list, val) => {
            return list.findIndex(l => l.equals(val)) < 0;
        });
        let userList = await UserMapper.queryById(userIdList, { imgHost: resetOpt.imgHost });

        let voteList: VoteInstanceType[];
        if (resetOpt.user) {
            [
                voteList
            ] = await Promise.all([
                //点赞
                VoteModel.find({ userId: resetOpt.user._id, ownerId: allComment.map(ele => ele._id) })
            ]);
        }

        let commentResetOpt = {
            ...resetOpt,
            userList,
            voteList,
        };
        replyList = replyList.map(ele => CommentMapper.resetDetail(ele.toJSON(), commentResetOpt));
        let rows = commentList.map(detail => {
            let obj = CommentMapper.resetDetail(detail.toJSON(), commentResetOpt);
            if (getReply) {
                obj.replyList = replyList.filter(reply => reply.topId.equals(detail._id));
            }
            return obj;
        });
        return {
            ...rs,
            rows,
        };
    }

    //获取子级评论
    static async childQuery(opt: {
        replyTopId: any,
        rows?: number,
        resetOpt?: CommentResetOption,
    }) {
        let topId = opt.replyTopId instanceof Array ? { $in: opt.replyTopId.map(ele => Types.ObjectId(ele)) } : Types.ObjectId(opt.replyTopId);
        let match = { _id: topId };
        let pipeline: any[] = [
            {
                $match: match
            },
            {
                $project: { _id: 1 }
            },
            {
                $lookup: {
                    from: CommentModel.collection.collectionName,
                    let: { topId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$topId', '$$topId'] } } },
                        { $sort: { _id: 1 } },
                        { $limit: opt.rows || 3 }
                    ],
                    as: 'replyList',
                }
            },
            { $unwind: '$replyList' }

        ];

        let rs = await CommentModel.aggregate(pipeline);
        return rs.map(ele => new CommentModel(ele.replyList));
    }

    static async findOwner(opt: {
        ownerId,
        type,
        mgt?: boolean
    }) {
        let owner: ContentBaseInstanceType;
        let match: any = { _id: opt.ownerId };
        if (opt.type == myEnum.contentType.文章) {
            if (!opt.mgt)
                match.status = myEnum.articleStatus.审核通过;
            owner = await ArticleMapper.findOne(match);
        } else if (opt.type == myEnum.contentType.视频) {
            if (!opt.mgt)
                match.status = myEnum.videoStatus.审核通过;
            owner = await VideoMapper.findOne(match);
        }
        if (!owner)
            throw common.error('', config.error.DB_NO_DATA);
        return owner;
    }

    static resetDetail(detail, opt: CommentResetOption) {
        let { userList, user, voteList } = opt;
        if (user) {
            if (voteList?.length) {
                let vote = voteList.find(ele => ele.ownerId.equals(detail._id) && ele.userId.equals(user._id));
                detail.voteValue = vote ? vote.value : myEnum.voteValue.无;
            }
            let rs = {
                canDel: detail.canDel
                    && (user.equalsId(detail.userId)
                        || Auth.contains(user, config.auth.commentMgtDel)
                        // || (opt.authorId && opt.authorId.equals(user._id))
                    ),
            };
            detail.canDel = rs.canDel;
        }
        if (userList?.length) {
            detail.quoteUser = userList.find(u => u._id.equals(detail.quoteUserId));
            detail.user = userList.find(u => u._id.equals(detail.userId));
        }
        if (detail.user) {
            UserMapper.resetDetail(detail.user, { imgHost: opt.imgHost });
        }
        if (detail.status !== myEnum.commentStatus.正常) {
            detail.isDel = true;
            delete detail.comment;
            delete detail.user;
        }
        delete detail.updatedAt;
        delete detail.__v;
        return detail;
    }
}