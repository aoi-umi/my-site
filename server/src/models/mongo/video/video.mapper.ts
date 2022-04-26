import { Types } from 'mongoose';

import * as config from '@/dev-config';
import { myEnum } from '@/dev-config';
import * as ValidSchema from '@/valid-schema/class-valid';
import { error, escapeRegExp } from '@/_system/common';
import { Auth } from '@/_system/auth';
import { transaction } from '@/_system/dbMongo';

import { LoginUser } from '../../login-user';
import { UserModel, UserMapper } from '../user';
import {
  ContentMapper,
  ContentResetOption,
  ContentQueryOption,
  ContentUpdateStatusOutOption,
  ContentLogModel,
} from '../content';
import { VideoInstanceType, VideoModel, VideoDocType } from './video';
import { BaseMapper } from '../_base';
import { FileMapper, FileModel } from '../file';

type VideoResetOption = ContentResetOption & {
  videoHost?: string;
};
type VideoQueryOption = ContentQueryOption<VideoResetOption>;
export class VideoMapper {
  static async query(
    data: ValidSchema.VideoQuery,
    opt: {
      noTotal?: boolean;
    } & VideoQueryOption,
  ) {
    function setMatch(match) {
      let userId = opt.userId;
      if (opt.normal) {
        match.status = myEnum.videoStatus.审核通过;
        match.publishAt = { $lte: new Date() };
      } else if (opt.audit) {
        //排除非本人的草稿
        match.$expr = {
          $not: {
            $and: [
              { $ne: ['$userId', userId] },
              { $eq: ['$status', myEnum.videoStatus.草稿] },
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
      model: VideoModel,
      setMatch,
      resetDetail: (data) => {
        return this.resetDetail(data, opt.resetOpt);
      },
    });
  }

  static async detailQuery(data, opt: VideoQueryOption) {
    let rs = await ContentMapper.detailQuery({
      ...opt,
      query: async () => {
        let { rows } = await this.query(data, { ...opt, noTotal: true });
        let detail = rows[0];
        return detail;
      },
    });
    let detail = rs.detail;
    let fileList = await FileMapper.findWithRaw({ _id: detail.videoIdList });
    detail.videoList = detail.videoIdList.map((videoId) => {
      let file = fileList.find((f) => f.file._id.equals(videoId));
      let rawFile = file.rawFile;
      let merge = {
        contentType: '',
      };
      if (rawFile) {
        for (let key in merge) {
          if (rawFile[key]) merge[key] = rawFile[key];
        }
      }
      return {
        _id: videoId,
        url: FileMapper.getVideoUrl(videoId, opt.resetOpt.videoHost),
        ...merge,
      };
    });
    //获取文件类型
    return rs;
  }

  static async findOne(data) {
    let detail = await VideoModel.findOne(data);
    if (!detail) throw error('', config.error.DB_NO_DATA);
    return detail;
  }

  static resetDetail(detail, opt: VideoResetOption) {
    let { user } = opt;
    if (user) {
      let rs = {
        canDel:
          detail.canDel &&
          (user.equalsId(detail.userId) ||
            Auth.contains(user, config.auth.articleMgtAudit)),
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
      model: VideoModel,
      contentType: myEnum.contentType.文章,
      passCond: () => toStatus === myEnum.videoStatus.审核通过,
      delCond: () => operate === myEnum.contentOperate.删除,
      recoveryCond: () => operate === myEnum.contentOperate.恢复,
    });
    //将会弃用
    let updateStatus = toStatus;
    if (rs?.length === 1) {
      updateStatus = rs[0].toStatus;
    }
    return {
      status: updateStatus,
      statusText: myEnum.videoStatus.getKey(updateStatus),
      updateResult: rs,
    };
  }

  static async mgtSave(data: ValidSchema.VideoSave, opt: { user: LoginUser }) {
    let status = data.submit
      ? myEnum.articleStatus.待审核
      : myEnum.articleStatus.草稿;
    let saveKey: (keyof VideoDocType)[] = [
      'cover',
      'title',
      'profile',
      'videoIdList',
      'remark',
      'setPublish',
      'setPublishAt',
    ];
    let rs = await ContentMapper.mgtSave(data, {
      ...opt,
      contentType: myEnum.contentType.文章,
      model: VideoModel,
      status,
      saveKey,
      getDetail: async () => {
        let detail = await VideoMapper.findOne({ _id: data._id });
        return detail;
      },
    });
    return rs;
  }
}
