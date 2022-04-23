import { Types } from 'mongoose';

import * as ValidSchema from '@/valid-schema/class-valid';
import { Auth } from '@/_system/auth';
import * as common from '@/_system/common';
import * as config from '@/dev-config';
import { myEnum } from '@/dev-config';

import { LoginUser } from '../../login-user';
import { BaseMapper } from '../_base';
import { ContentBaseInstanceType } from '../content';
import { ArticleMapper, ArticleModel } from '../article';
import { VideoMapper, VideoModel } from '../video';
import { UserModel, UserMapper, UserDocType, UserResetOption } from '../user';
import { VoteModel, VoteMapper, VoteInstanceType } from '../vote';
import { CommentModel, CommentDocType, CommentInstanceType, CommentModelType } from './comment';

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
    let lastMainComment = await CommentModel.findOne({ ownerId: data.ownerId }).sort({ mainFloor: -1 });
    let quote: CommentInstanceType;
    if (data.quoteId)
      quote = await CommentModel.findById(data.quoteId);

    let obj: any = {
      userId: user._id,
      ownerId: data.ownerId,
      comment: data.comment,
      topId: data.topId,
      type: type,
      floor: (lastComment?.floor || 0) + 1,
      mainFloor: (!data.quoteId ? lastMainComment?.mainFloor || 0 : -1) + 1
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

    let pipeline: any[] = [
      {
        $match: match
      },
    ];

    let rs = await CommentModel.aggregatePaginate(pipeline, {
      ...BaseMapper.getListOptions({
        ...data,
      }),
    });

    let { rows } = await this.resetComment({
      ...opt,
      commentList: rs.rows,
      getReply,
    });

    return {
      ...rs,
      rows,
    };
  }

  static async resetComment<T = {}>(opt: {
    resetOpt?: CommentResetOption,
    commentList: any[],
    otherCommentList?: CommentInstanceType[],
    getReply?: boolean
  }) {
    let { getReply } = opt;
    let resetOpt = { ...opt.resetOpt };

    let commentList = opt.commentList.map(ele => new CommentModel(ele));
    let quoteList = commentList.filter(ele => ele.quoteUserId);

    let replyList = [];
    //获取二级回复
    if (getReply) {
      replyList = await CommentMapper.childQuery({ replyTopId: commentList.map(ele => ele._id) });
    }

    //获取用户信息
    let allComment: CommentInstanceType[] = [...commentList, ...replyList];
    if (opt.otherCommentList) {
      allComment.push(...opt.otherCommentList);
    }
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
    let allCommentList = allComment.map(ele => {
      let obj = CommentMapper.resetDetail(ele.toJSON(), commentResetOpt);
      return obj;
    });

    let rows = commentList.map(detail => {
      let matched = allCommentList.find(ele => detail._id.equals(ele._id));
      let obj = common.clone(matched) as typeof matched & { replyList: any[] };
      if (getReply) {
        obj.replyList = allCommentList.filter(reply => detail._id.equals(reply.topId));
      }
      return obj;
    });
    return {
      allCommentList,
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

  static resetDetail<T = {}>(detail, opt: CommentResetOption) {
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
    detail.isDel = false;
    if ([myEnum.commentStatus.已删除].includes(detail.status)) {
      detail.isDel = true;
      delete detail.comment;
      delete detail.user;
    }
    delete detail.updatedAt;
    delete detail.__v;
    return detail as CommentDocType & { user: any, quoteUser: any, isDel: boolean } & T;
  }

  // user comment
  static async userCommentQuery(data: ValidSchema.UserCommentQuery, opt: {
    resetOpt?: CommentResetOption,
  }) {
    let { user } = opt.resetOpt;
    let match: any = {
      status: { $nin: [config.myEnum.commentStatus.已删除] }
    };
    let userId = user._id;
    if (!data.isReply) {
      match.userId = userId;
    } else {
      match.userId = { $ne: userId };
    }

    let match2: any = {};
    let anyKeyAnd = BaseMapper.multiKeyLike(data.anyKey, (anykey) => {
      return {
        $or: [
          { 'comment.comment': anykey },
          { 'owner.title': anykey },
        ]
      };
    });
    let and = [];
    if (anyKeyAnd.length) {
      and.push({ $and: anyKeyAnd });
    }
    if (and.length)
      match2.$and = and;
    let pipeline: any[] = [
      {
        $match: match
      },
      { $project: { comment: '$$ROOT', ownerId: 1, topId: 1 } },
      {
        $lookup: {
          from: ArticleModel.collection.name,
          localField: 'ownerId',
          foreignField: '_id',
          as: 'article'
        }
      },
      {
        $lookup: {
          from: VideoModel.collection.name,
          localField: 'ownerId',
          foreignField: '_id',
          as: 'video'
        }
      },
      {
        $project: {
          comment: 1,
          owner: {
            $cond: { if: { $gt: [{ $size: '$article' }, 0] }, then: '$article', else: '$video' }
          }
        }
      },
      { $unwind: '$owner' },
      {
        $match: match2
      },
    ];

    if (data.isReply) {
      pipeline.push({
        $match: {
          $or: [
            { 'owner.userId': userId }, { 'comment.quoteUserId': userId },
          ]
        }
      });
    }

    let rs = await CommentModel.aggregatePaginate(pipeline, {
      ...BaseMapper.getListOptions({
        ...data,
      }),
    });

    let quoteList: CommentInstanceType[] = [];
    let rsRows = rs.rows as any as { comment: CommentDocType, owner: any }[];

    // 获取回复的
    if (data.isReply) {
      let quoteIds = rsRows.filter(ele => ele.comment.quoteId).map(ele => ele.comment.quoteId);
      quoteList = await CommentModel.find({ _id: quoteIds });
    }

    let { rows, allCommentList } = await this.resetComment({
      ...opt,
      commentList: rsRows.map(ele => ele.comment),
      otherCommentList: quoteList
    });


    rows.forEach((ele, idx) => {
      let rsRow = rsRows[idx];
      let obj = ele as typeof ele & { owner: any, replyList?: any[], quote: any };
      obj.owner = {
        _id: rsRow.owner._id,
        title: rsRow.owner.title
      };

      if (data.isReply) {
        if (ele.quoteId) {
          let quote = allCommentList.find(q => q._id.equals(ele.quoteId));

          if (quote)
            obj.quote = {
              comment: quote.comment,
              isDel: quote.isDel,
            };
        }
        delete obj.quoteUser;
      } else
        delete obj.user;
    });

    return {
      ...rs,
      rows,
    };
  }
}