import { transaction } from '@/_system/dbMongo';
import { error } from '@/_system/common';
import { Auth } from '@/_system/auth';
import * as config from '@/dev-config';
import { paramsValid } from '@/helpers';
import * as ValidSchema from '@/valid-schema/class-valid';
import { MyRequestHandler } from '@/middleware';

import { CommentMapper, CommentModel } from '@/models/mongo/comment';
import { UserMapper } from '@/models/mongo/user';
import { ContentMapper } from '@/models/mongo/content';

export let submit: MyRequestHandler = async (opt) => {
  let user = opt.myData.user;
  let data = paramsValid(opt.reqData, ValidSchema.CommentSubmit);
  let owner = await CommentMapper.findOwner({
    ownerId: data.ownerId,
    type: data.type,
  });
  let comment = await CommentMapper.create(data, data.type, user);
  comment.ip = opt.myData.ip;
  await transaction(async (session) => {
    await comment.save({ session });
    await owner.updateOne({ commentCount: owner.commentCount + 1 });
  });
  let ret = {
    ...comment.toJSON(),
    user: {
      _id: user._id,
      account: user.account,
      nickname: user.nickname,
      avatar: user.avatar,
      avatarUrl: user.avatarUrl,
    },
  };
  let obj = CommentMapper.resetDetail<{ replyList: any[] }>(ret, {
    user,
    imgHost: opt.myData.imgHost,
  });
  if (comment.quoteUserId) {
    let list = await UserMapper.queryById(comment.quoteUserId, {
      imgHost: opt.myData.imgHost,
    });
    obj.quoteUser = list[0];
  } else {
    obj.replyList = [];
  }
  return obj;
};

export let query: MyRequestHandler = async (opt) => {
  let user = opt.myData.user;
  let data = paramsValid(opt.reqData, ValidSchema.CommentQuery);
  let { total, rows } = await CommentMapper.query(
    {
      ...data,
    },
    {
      resetOpt: {
        imgHost: opt.myData.imgHost,
        user: user.isLogin ? user : null,
      },
    },
  );

  return {
    rows,
    total,
  };
};

export let hotQuery: MyRequestHandler = async (opt) => {
  let user = opt.myData.user;
  let data = paramsValid(opt.reqData, ValidSchema.CommentQuery);
  let { total, rows } = await CommentMapper.query(
    {
      ...data,
    },
    {
      resetOpt: {
        imgHost: opt.myData.imgHost,
        user: user.isLogin ? user : null,
      },
    },
  );

  return {
    rows,
    total,
  };
};

export let del: MyRequestHandler = async (opt) => {
  let user = opt.myData.user;
  let data = paramsValid(opt.reqData, ValidSchema.CommentDel);
  /**
   * 可删除
   * 1.本人
   * 2.有评论管理-删除权限的
   *  */
  let match = { _id: { $in: data.idList } };
  let delIdList = [];
  if (Auth.contains(user, config.auth.commentMgtDel)) {
    delIdList = data.idList;
  } else {
    //本人只能单条删除
    let id = data.idList[0];
    let detail = await CommentModel.findById(id);
    if (detail) {
      if (user.equalsId(detail.userId)) delIdList = [id];
    }
  }
  if (!delIdList.length) throw error('', config.error.NO_MATCH_DATA);
  let rs = await CommentModel.updateMany(match, {
    status: config.myEnum.commentStatus.已删除,
  });
  if (!rs.n) throw error('', config.error.NO_MATCH_DATA);
};

export let setAsTop: MyRequestHandler = async (opt) => {
  let user = opt.myData.user;
  let data = paramsValid(opt.reqData, ValidSchema.CommentSetAsTop);
  let id = data._id;
  let detail = await CommentModel.findById(id);
  if (!detail) throw error('comment not found', config.error.NO_MATCH_DATA);
  let content = await ContentMapper.mixModelQuery({
    contentType: detail.type,
    _id: detail.ownerId,
  });
  if (!content) throw error('content not found', config.error.NO_MATCH_DATA);
  if (!user.equalsId(content.userId))
    throw error('', config.error.NO_PERMISSIONS);
  await transaction(async (session) => {
    await CommentModel.updateMany(
      { ownerId: detail.ownerId },
      { isSetAsTop: false },
      { session },
    );
    if (data.isSetAsTop)
      await detail.updateOne({ isSetAsTop: true }, { session });
  });
};
