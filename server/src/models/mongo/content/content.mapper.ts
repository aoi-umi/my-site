import { Types } from 'mongoose';
import { ClientSession } from 'mongodb';

import { myEnum } from '@/dev-config';
import * as config from '@/dev-config';
import { error, escapeRegExp } from '@/_system/common';
import { transaction } from '@/_system/dbMongo';
import * as ValidSchema from '@/valid-schema/class-valid';

import { LoginUser } from '../../login-user';
import { FileMapper } from '../file';
import { ContentBaseInstanceType, ContentBaseModelType } from './content-base';
import { ContentLogMapper } from './content-log.mapper';
import { BaseMapper } from '../_base';
import { VoteMapper } from '../vote';
import { UserMapper, UserModel, UserInstanceType } from '../user';
import {
  ContentLogDocType,
  ContentLogInstanceType,
  ContentLogModel,
} from './content-log';
import { FavouriteMapper } from '../favourite';
import { ContentBase, ContentBaseDocType } from '.';
import { ViewHistoryMapper } from '../view-history/view-history.mapper';
import { ArticleModel } from '../article';
import { VideoModel } from '../video';
import { ContentContactBaseModelType } from './content-contact';
import { Auth } from '@/_system/auth';

export type ContentResetOption = {
  user?: LoginUser;
  imgHost?: string;
};

export type ContentQueryOption<
  T extends ContentResetOption = ContentResetOption,
> = {
  audit?: boolean;
  normal?: boolean;
  userId?: Types.ObjectId;
  resetOpt: T;
};

export type ContentUpdateStatusOutOption = {
  cond: {
    idList: Types.ObjectId[];
    status?: any;
    includeUserId?: Types.ObjectId | string;
  };
  operate: string;
  user: LoginUser;
  logRemark?: string;
};

export class ContentMapper {
  static async query(
    data: ValidSchema.ContentQuery,
    opt: {
      // model: ContentBaseModelType,
      model: any;
      setMatch?: (match) => void;
      resetDetail?: (data: any) => any;
    } & ContentQueryOption,
  ) {
    opt = { ...opt };
    let match: any = {};

    if (data._id) {
      match._id = data._id;
    }

    if (data.userId) {
      match.userId = data.userId;
    }

    match = {
      ...match,
      ...BaseMapper.getLikeCond(data, ['title']),
    };

    if (data.status)
      match.status = {
        $in: data.status.split(',').map((ele) => parseInt(ele)),
      };

    let and = [];
    if (data.user) {
      let user = new RegExp(escapeRegExp(data.user), 'i');
      and.push({
        $or: [{ 'user.nickname': user }, { 'user.account': user }],
      });
    }

    if (and.length) match.$and = and;

    opt.setMatch && opt.setMatch(match);

    let pipeline: any[] = [...UserMapper.lookupPipeline(), { $match: match }];
    let resetOpt = { ...opt.resetOpt };
    let extraPipeline = [];
    if (opt.normal && resetOpt.user) {
      extraPipeline = [
        ...VoteMapper.lookupPipeline({
          userId: resetOpt.user._id,
        }),
        ...FavouriteMapper.lookupPipeline({
          userId: resetOpt.user._id,
        }),
      ];
    }

    let model = opt.model as ContentBaseModelType;
    if (!data.orderBy && opt.normal) data.orderBy = 'publishAt';
    let rs = await model.aggregatePaginate(pipeline, {
      ...BaseMapper.getListOptions(data),
      ...opt,
      extraPipeline,
    });
    let rows = rs.rows.map((ele) => {
      let e = {
        ...ele,
        ...new model(ele).toJSON(),
      };
      return opt.resetDetail ? opt.resetDetail(e) : e;
    });
    return {
      ...rs,
      rows,
    };
  }

  static async detailQuery(
    opt: ContentQueryOption & { query: <T = any>() => Promise<T> },
  ) {
    let detail = await opt.query();
    let dWithType = detail as ContentBaseInstanceType;
    if (!detail) throw error('', config.error.DB_NO_DATA);
    let rs = {
      detail,
      log: null as ContentLogDocType[],
    };
    if (!opt.normal) {
      let logRs = await ContentLogModel.aggregatePaginate<{
        user: any;
      }>([
        { $match: { contentId: dWithType._id } },
        ...UserMapper.lookupPipeline(),
        { $sort: { _id: -1 } },
      ]);
      rs.log = logRs.rows.map((ele) => {
        let obj = new ContentLogModel(ele).toJSON() as any;
        UserMapper.resetDetail(ele.user, { imgHost: opt.resetOpt.imgHost });
        obj.user = ele.user;
        return obj;
      });
      let lastLog = rs.log[0];
      if (lastLog) {
        detail.canRecovery = this.canRecovery({
          detail,
          log: lastLog,
          user: opt.resetOpt.user,
        });
      }
    }
    return rs;
  }

  static resetDetail(detail, opt: ContentResetOption) {
    detail.coverUrl = FileMapper.getImgUrl(detail.cover, opt.imgHost);
    if (detail.user) {
      detail.user.avatarUrl = FileMapper.getImgUrl(
        detail.user.avatar,
        opt.imgHost,
      );
    }
    detail.voteValue = detail.vote ? detail.vote.value : myEnum.voteValue.无;
    detail.favouriteValue = detail.favouriteDetail
      ? detail.favouriteDetail.favourite
      : false;
    delete detail.vote;
    delete detail.favouriteDetail;
    return detail;
  }

  static canRecovery(opt: {
    detail: ContentBaseInstanceType;
    log: ContentLogDocType;
    user: LoginUser;
  }) {
    let { detail, log, user } = opt;
    return (
      detail.canRecoveryStatus &&
      log &&
      /*
      1.有恢复权限，且不是本人删除
      2.本人删除
      */
      ((Auth.contains(user, config.auth.articleMgtRecovery) &&
        !detail.userId.equals(log.userId)) ||
        user.equalsId(log.userId))
    );
  }

  static async updateStatus(
    opt: {
      model: ContentBaseModelType;
      contentType: number;
      getChangeData: (opt: {
        detail: ContentBaseInstanceType;
        operate;
        lastLog: ContentLogInstanceType;
      }) => {
        status?: number;
        // 用户里的文章/视频数量
        changeNum?: number;
      };
    } & ContentUpdateStatusOutOption,
  ) {
    let { user, operate } = opt;
    let { idList, includeUserId, status } = opt.cond;
    let cond: any = { _id: { $in: idList } };
    if (status !== undefined) cond.status = status;
    let model = opt.model;
    let list = await model.find(cond);
    if (!list.length) throw error('', config.error.NO_MATCH_DATA);
    let changeNumUserMap = {};
    let bulk = [],
      log = [];
    let updateRsList = [];
    for (let detail of list) {
      if (includeUserId && !detail.userId.equals(includeUserId)) {
        updateRsList.push({
          _id: detail._id,
          msg: '无权限',
        });
        continue;
      }
      let lastLog = await ContentLogModel.findOne({
        contentId: detail._id,
      }).sort({ _id: -1 });
      let changeData = opt.getChangeData({
        detail,
        operate,
        lastLog,
      });
      changeData = {
        changeNum: 0,
        ...changeData,
      };
      let toStatus = changeData.status;
      if (detail.status === toStatus) {
        updateRsList.push({
          _id: detail._id,
          status: toStatus,
        });
        continue;
      }
      let update: any = {};
      let updateStatus;
      let userIdStr = detail.userId.toHexString();
      if (!changeNumUserMap[userIdStr]) changeNumUserMap[userIdStr] = 0;
      if (operate === myEnum.contentOperate.审核通过) {
        updateStatus = toStatus;
        changeNumUserMap[userIdStr] += changeData.changeNum;
        let now = new Date();
        update.publishAt = now;
        //指定时间发布
        if (
          detail.setPublish &&
          detail.setPublishAt &&
          detail.setPublishAt.getTime() > now.getTime()
        ) {
          update.publishAt = detail.setPublishAt;
        }
      } else if (operate === myEnum.contentOperate.删除) {
        if (detail.canDel) {
          updateStatus = toStatus;
          changeNumUserMap[userIdStr] += changeData.changeNum;
        }
      } else if (operate === myEnum.contentOperate.恢复) {
        let canRecovery = this.canRecovery({
          detail,
          log: lastLog,
          user,
        });
        if (canRecovery) {
          updateStatus = lastLog.srcStatus;
          changeNumUserMap[userIdStr] += changeData.changeNum;
        }
      } else {
        updateStatus = toStatus;
        changeNumUserMap[userIdStr] += changeData.changeNum;
      }
      update.status = updateStatus;
      if (updateStatus === undefined) {
        updateRsList.push({
          _id: detail._id,
          toStatus: null,
        });
        continue;
      }
      updateRsList.push({
        _id: detail._id,
        toStatus: updateStatus,
      });
      log.push(
        ContentLogMapper.create(detail, user, {
          contentType: opt.contentType,
          srcStatus: detail.status,
          destStatus: updateStatus,
          remark: opt.logRemark,
          operate: opt.operate,
        }),
      );
      bulk.push({
        updateOne: {
          filter: { _id: detail._id },
          update: {
            $set: update,
          },
        },
      });
    }

    if (!bulk.length) return updateRsList;
    await transaction(async (session) => {
      await this.updateCountInUser({
        contentType: opt.contentType,
        changeNumUserMap,
        session,
      });
      await model.bulkWrite(bulk, { session });
      await ContentLogModel.insertMany(log, { session });
    });
    return updateRsList;
  }

  //更新稿件数量
  static async updateCountInUser(opt: {
    contentType: number;
    changeNumUserMap: { [key: string]: number };
    session?: ClientSession;
  }) {
    let { changeNumUserMap, session } = opt;
    let userIds = Object.entries(changeNumUserMap)
      .filter(([k, v]) => v !== 0)
      .map(([k]) => k);
    if (!userIds.length) return;
    let key = '';
    switch (opt.contentType) {
      case myEnum.contentType.文章:
        key = 'article';
        break;
      case myEnum.contentType.视频:
        key = 'video';
        break;
      default:
        throw error(`unhandle type: ${opt.contentType}`);
    }
    for (let userId of userIds) {
      let changeNum = changeNumUserMap[userId];
      let user = await UserModel.findOne({ _id: userId });
      await user.update({ [key]: user[key] + changeNum }, { session });
    }
  }

  static async recovery(opt: { model: any; contentType: number }) {}

  static async mgtSave(
    data: ValidSchema.ContentSave,
    opt: {
      user: LoginUser;
      contentType: number;
      saveKey: string[];
      model: any;
      status: number;
      getDetail: () => Promise<any>;
    },
  ) {
    let { user } = opt;
    let detail: ContentBaseInstanceType;
    let status = opt.status;

    let saveData = {};
    opt.saveKey.forEach((key) => {
      saveData[key] = data[key];
    });
    if (!data._id) {
      let model = opt.model as ContentBaseModelType;
      detail = new model({
        ...saveData,
        status,
        userId: user._id,
      });
      let log = ContentLogMapper.create(detail, user, {
        contentType: opt.contentType,
        srcStatus: status,
        destStatus: status,
        remark: detail.remark,
      });
      await transaction(async (session) => {
        await detail.save({ session });
        await log.save({ session });
      });
    } else {
      detail = await opt.getDetail();
      if (!user.equalsId(detail.userId))
        throw error('', config.error.NO_PERMISSIONS);
      if (!detail.canUpdate) {
        throw error('当前状态无法修改');
      }
      let update: any = {
        ...saveData,
        status,
      };
      let logRemark = update.remark == detail.remark ? null : update.remark;
      let log = ContentLogMapper.create(detail, user, {
        contentType: opt.contentType,
        srcStatus: detail.status,
        destStatus: status,
        remark: logRemark,
      });
      await transaction(async (session) => {
        await detail.update(update);
        await log.save({ session });
      });
    }
    return detail;
  }

  static async mixQuery(
    data: ValidSchema.ContentQuery,
    opt: {
      resetOpt: ContentResetOption;
      // ContentContactModel: ContentContactBaseModelType,
      ContentContactModel: any;
      merge?: object;
    },
  ) {
    let { resetOpt } = opt;
    let ContentContactModel =
      opt.ContentContactModel as ContentContactBaseModelType;
    let match2: any = {};
    let and = [];
    let anyKeyAnd = BaseMapper.multiKeyLike(data.anyKey, (anykey) => {
      return {
        $or: [
          { title: anykey },
          { content: anykey },
          { profile: anykey },
          { 'user.nickname': anykey },
          { 'user.account': anykey },
        ],
      };
    });
    if (anyKeyAnd.length) {
      and.push({
        $and: anyKeyAnd,
      });
    }
    if (and.length) match2.$and = and;

    let rs = await ContentContactModel.aggregatePaginate(
      [
        {
          $match: {
            userId: resetOpt.user._id,
          },
        },
        ...[ArticleModel, VideoModel].map<any>((model) => {
          return {
            $lookup: {
              from: model.collection.collectionName,
              let: { ownerId: '$ownerId' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$$ownerId', '$_id'] },
                  },
                },
              ],
              as: model.collection.collectionName,
            },
          };
        }),
        {
          $addFields: {
            'article.contentType': myEnum.contentType.文章,
            'video.contentType': myEnum.contentType.视频,
          },
        },
        {
          $project: {
            root: '$$ROOT',
            items: {
              $concatArrays: ['$article', '$video'],
            },
          },
        },
        {
          $unwind: '$items',
        },
        {
          $replaceRoot: {
            newRoot: { $mergeObjects: ['$items', opt.merge] },
          },
        },
        ...UserMapper.lookupPipeline(),
        ...VoteMapper.lookupPipeline({
          userId: resetOpt.user._id,
        }),
        ...FavouriteMapper.lookupPipeline({
          userId: resetOpt.user._id,
        }),
        {
          $match: match2,
        },
      ],
      {
        ...BaseMapper.getListOptions(data),
      },
    );
    rs.rows = rs.rows.map((ele) => {
      ContentMapper.resetDetail(ele, resetOpt);
      return ele;
    });
    return rs;
  }

  static async mixModelQuery(opt: { contentType: number; _id: any }) {
    let { contentType } = opt;
    let rs: ContentBaseInstanceType;
    switch (contentType) {
      case myEnum.contentType.文章:
        rs = await ArticleModel.findById(opt._id);
        break;
      case myEnum.contentType.视频:
        rs = await VideoModel.findById(opt._id);
        break;
    }
    return rs;
  }

  static async contentView(opt: {
    detail: ContentBase | ContentBaseDocType;
    type: number;
    user?: LoginUser;
    model: ContentBaseModelType;
  }) {
    let { user, model, detail, type } = opt;
    model
      .update({ _id: detail._id }, { readTimes: detail.readTimes + 1 })
      .exec();
    if (user?.isLogin) {
      ViewHistoryMapper.save({ ownerId: detail._id, type }, user);
    }
  }
}
