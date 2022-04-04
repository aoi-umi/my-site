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

    let { rows } = await this.restComment({
      ...opt,
      commentList: rs.rows,
      getReply,
    });

    return {
      ...rs,
      rows,
    };
  }

  static async restComment<T = {}>(opt: {
    resetOpt?: CommentResetOption,
    commentList: any[]
    getReply?: boolean
  }) {
    let { getReply, } = opt;
    let resetOpt = { ...opt.resetOpt };

    let commentList = opt.commentList.map(ele => new CommentModel(ele));
    let quoteList = commentList.filter(ele => ele.quoteUserId);

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
      let obj = CommentMapper.resetDetail<{ replyList: any[] } & T>(detail.toJSON(), commentResetOpt);
      if (getReply) {
        obj.replyList = replyList.filter(reply => reply.topId.equals(detail._id));
      }
      return obj;
    });
    return {
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
    user: LoginUser,
    isReply?: boolean,
    resetOpt?: CommentResetOption,
  }) {
    let { user } = opt;
    let match: any = {
      userId: user._id,
      status: { $nin: [config.myEnum.commentStatus.已删除] }
    };
    let anyKeyAnd = BaseMapper.multiKeyLike(data.anyKey, (anykey) => {
      return {
        $or: [
          { comment: anykey },
        ]
      };
    });
    let and = [];
    if (anyKeyAnd.length) {
      and.push({ $and: anyKeyAnd });
    }
    if (and.length)
      match.$and = and;
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
    let { rows } = await this.restComment<{ owner: any }>({
      ...opt,
      commentList: rs.rows,
    });

    // 获取对应的文章/视频
    let ownerIds = rows.map(ele => ele.ownerId);
    let [articleList, videoList] = await Promise.all([
      ArticleModel.find({ _id: ownerIds }),
      VideoModel.find({ _id: ownerIds })
    ]);

    let ownerList = [...articleList, ...videoList];
    rows.forEach(ele => {
      ele.owner = {};
      let matched = ownerList.find(owner => owner._id.equals(ele.ownerId));
      if (matched) {
        ele.owner._id = matched._id;
        ele.owner.title = matched.title;
      }
      if (opt.isReply)
        delete ele.quoteUser;
      else
        delete ele.user;
    });

    return {
      ...rs,
      rows,
    };
  }
}