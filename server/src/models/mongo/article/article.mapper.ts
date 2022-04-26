import { Types } from 'mongoose';

import * as config from '@/dev-config';
import { myEnum } from '@/dev-config';
import * as ValidSchema from '@/valid-schema/class-valid';
import { error, escapeRegExp } from '@/_system/common';
import { Auth } from '@/_system/auth';

import { LoginUser } from '../../login-user';
import { UserMapper } from '../user';
import {
  ContentLogModel,
  ContentQueryOption,
  ContentResetOption,
  ContentMapper,
  ContentUpdateStatusOutOption,
} from '../content';
import { ArticleModel, ArticleDocType } from './article';
import { BaseMapper } from '../_base';

export class ArticleMapper {
  static async query(
    data: ValidSchema.ArticleQuery,
    opt: {
      noTotal?: boolean;
    } & ContentQueryOption,
  ) {
    function setMatch(match) {
      let userId = opt.userId;
      if (opt.normal) {
        match.status = myEnum.articleStatus.审核通过;
        match.publishAt = { $lte: new Date() };
      } else if (opt.audit) {
        //排除非本人的草稿
        match.$expr = {
          $not: {
            $and: [
              { $ne: ['$userId', userId] },
              { $eq: ['$status', myEnum.articleStatus.草稿] },
            ],
          },
        };
      } else {
        match.userId = userId;
      }
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
      if (and.length) {
        match.$and = match.$and ? [...match.$and, ...and] : and;
      }
    }
    return ContentMapper.query(data, {
      ...opt,
      model: ArticleModel,
      setMatch,
      resetDetail: (data) => {
        return this.resetDetail(data, opt.resetOpt);
      },
    });
  }

  static async detailQuery(data, opt: ContentQueryOption) {
    let rs = await ContentMapper.detailQuery({
      ...opt,
      query: async () => {
        let { rows } = await this.query(data, { ...opt, noTotal: true });
        let detail = rows[0];
        return detail;
      },
    });
    return rs;
  }

  static async findOne(data) {
    let detail = await ArticleModel.findOne(data);
    if (!detail) throw error('', config.error.DB_NO_DATA);
    return detail;
  }

  static resetDetail(detail, opt: ContentResetOption) {
    let { user } = opt;
    if (user) {
      let rs = {
        canDel:
          detail.canDel &&
          (user.equalsId(detail.userId) ||
            Auth.contains(user, config.auth.articleMgtDel)),
        canUpdate: detail.canUpdate && user.equalsId(detail.userId),
      };
      detail.canDel = rs.canDel;
      detail.canUpdate = rs.canUpdate;
    }
    ContentMapper.resetDetail(detail, opt);
    return detail;
  }

  static async updateStatus(opt: ContentUpdateStatusOutOption) {
    let { toStatus, operate } = opt;
    let rs = await ContentMapper.updateStatus({
      ...opt,
      model: ArticleModel,
      contentType: myEnum.contentType.文章,
      passCond: () => toStatus === myEnum.articleStatus.审核通过,
      delCond: () => operate === myEnum.contentOperate.删除,
      recoveryCond: () => operate === myEnum.contentOperate.恢复,
    });
    let updateStatus = toStatus;
    if (rs?.length === 1) {
      updateStatus = rs[0].toStatus;
    }
    return {
      status: updateStatus,
      statusText: myEnum.articleStatus.getKey(updateStatus),
      updateResult: rs,
    };
  }

  static async mgtSave(
    data: ValidSchema.ArticleSave,
    opt: { user: LoginUser },
  ) {
    let status = data.submit
      ? myEnum.articleStatus.待审核
      : myEnum.articleStatus.草稿;
    let saveKey: (keyof ArticleDocType)[] = [
      'cover',
      'title',
      'profile',
      'content',
      'contentType',
      'remark',
      'setPublish',
      'setPublishAt',
    ];
    let rs = await ContentMapper.mgtSave(data, {
      ...opt,
      contentType: myEnum.contentType.文章,
      model: ArticleModel,
      status,
      saveKey,
      getDetail: async () => {
        let detail = await ArticleMapper.findOne({ _id: data._id });
        return detail;
      },
    });
    return rs;
  }
}
