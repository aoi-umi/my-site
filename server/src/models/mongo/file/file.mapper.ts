import { Types } from 'mongoose';
import * as path from 'path';
import * as fs from 'fs';
import { GridFSInstance } from 'mongoose-ts-ua';

import * as common from '@/_system/common';
import * as config from '@/config';
import { myEnum } from '@/config';
import * as ValidSchema from '@/valid-schema/class-valid';
import { LoginUser } from '@/models/login-user';

import { FileModel, FileInstanceType } from './file';
import { FileRawInstance, FileRawModel } from './file-raw';
import { BaseMapper } from '../_base';

const Prefix = {
  [myEnum.fileType.图片]: config.env.imgPrefix,
  [myEnum.fileType.视频]: config.env.videoPrefix,
};
export class FileMapper {
  static getUrl(_id, fileType: string, opt?: {
    host?: string;
    isRaw?: boolean;
  }) {
    if (!_id)
      return '';
    opt = {
      ...opt
    };
    let host = opt.host;
    if (host) {
      host = '//' + host;
    }
    let url = Prefix[fileType];
    let params: any = {
      _id
    };
    if (opt.isRaw)
      params.isRaw = true;
    return !url ? '' :
      host + url + '?' +
      Object.entries(params)
        .filter(o => o[1])
        .map(o => `${o[0]}=${o[1]}`)
        .join('&');
  }

  static getImgUrl(_id, host?: string) {
    return this.getUrl(_id, myEnum.fileType.图片, { host });
  }

  static getVideoUrl(_id, host?: string) {
    return this.getUrl(_id, myEnum.fileType.视频, { host });
  }

  static async findWithRaw(cond) {
    let fileList = await FileModel.find(cond);
    let rawFileList = [];
    let rawDiskFileList = [];
    if (fileList.length) {
      rawFileList = await FileModel.rawFind({ _id: { $in: fileList.map(ele => ele.fileId) } });
      rawDiskFileList = await FileRawModel.find({ _id: { $in: fileList.map(ele => ele.fileId) } });
    }
    return fileList.map(file => {
      let rawFile = rawFileList.find(raw => raw._id.equals(file.fileId));
      if (!rawFile) {
        rawFile = rawDiskFileList.find(raw => raw._id.equals(file.fileId));
      }
      return {
        file,
        rawFile: {
          contentType: rawFile.contentType,
          _id: rawFile._id,
          length: rawFile.length
        }
      };
    });
  }

  private static getDiskFilePath(filename) {
    return path.resolve(config.env.filePath, filename);
  }

  private static async saveFileToDisk(opt: {
    data: Buffer,
    contentType?: string
  }) {
    let { data, contentType } = opt;
    let md5 = common.md5(data);
    let filename = this.getDiskFilePath(md5);

    let length = data.length;
    if (!fs.existsSync(filename)) {
      await common.writeFile(filename, data);
    }
    let fr = await FileRawModel.findOne({ md5 });
    if (!fr) {
      fr = await FileRawModel.create({
        md5,
        filename: md5,
        length,
        contentType
      });
    }
    return {
      md5,
      filename,
      fileId: fr._id
    };
  }

  static async upload(opt: {
    fileType: string,
    contentType: string,
    filename: string,
    buffer: Buffer,
    user: Partial<{
      _id: Types.ObjectId;
      nickname: string;
      account: string;
    }>,
    imgHost?: string,
  }) {
    let { user } = opt;

    let fs = new FileModel({
      filename: opt.filename,
      fileType: opt.fileType
    });
    if (user) {
      fs.userId = user._id;
      fs.nickname = user.nickname;
      fs.account = user.account;
    }
    let fileContentType = opt.contentType.split('/')[0];
    if (
      (opt.fileType === myEnum.fileType.视频 && fileContentType !== 'video')
      || opt.fileType === myEnum.fileType.图片 && fileContentType !== 'image'
    )
      throw common.error('错误的文件类型');

    let fileObj = await this.saveFileToDisk({
      data: opt.buffer,
      contentType: opt.contentType
    });
    fs.fileId = fileObj.fileId;
    fs.storageDisk = true;
    await fs.save();

    // await fs.upload({
    //   buffer: opt.buffer,
    //   contentType: opt.contentType,
    // });
    let obj = fs.toOutObject();
    obj.url = FileMapper.getUrl(fs._id, opt.fileType, { host: opt.imgHost });
    return obj;
  }

  /**
  目前有两种存储方式，一种存在数据库，一种存在disk
  */
  static async download(data: ValidSchema.FileGet, opt: {
    fileType: string
    range?: {
      start: number
      end: number
    },
    ifModifiedSince?: string
  }) {
    let rawFile: GridFSInstance<any>;
    let diskRawFile: FileRawInstance;
    let fileModel: FileInstanceType;
    let range: { start: number, end: number };
    let { ifModifiedSince } = opt;

    let rawId;
    let length = 0;
    let noModified = false;
    if (data.isRaw) {
      rawId = data._id;
      rawFile = await FileModel.rawFindOne({ _id: data._id });
    } else {
      fileModel = await FileModel.findOne({ _id: data._id, fileType: opt.fileType });
      if (fileModel)
        rawId = fileModel.fileId;
    }
    rawFile = await FileModel.rawFindOne({ _id: rawId });
    if (!rawFile)
      diskRawFile = await FileRawModel.findOne({ _id: rawId });

    let stream: NodeJS.ReadableStream;
    let contentType: string;
    let modifiedDate: Date;
    let streamOpt;
    const setRange = (rangeOpt: { length }) => {
      let { length } = rangeOpt;
      if (opt.range) {
        range = {
          start: opt.range.start,
          end: opt.range.end || (length - 1)
        };
        streamOpt = {
          start: range.start,
          end: range.end + 1
        };
      }
    };
    if (rawFile) {
      length = rawFile.length;
      contentType = rawFile.contentType;
      modifiedDate = rawFile.uploadDate;
      setRange({ length });
      let downloadOpt: any = {
        returnStream: true,
      };
      if (range) {
        downloadOpt.streamOpt = streamOpt;
      } else if (ifModifiedSince) {
        downloadOpt.ifModifiedSince = ifModifiedSince;
      }
      let rs = await new FileModel({ fileId: rawFile._id }).download(downloadOpt);
      stream = rs.stream;
      noModified = rs.noModified;
    } else if (diskRawFile) {
      let filename = this.getDiskFilePath(diskRawFile.md5);
      if (fs.existsSync(filename)) {
        let stat = fs.statSync(filename);
        length = diskRawFile.length;
        contentType = diskRawFile.contentType;
        modifiedDate = stat.mtime;

        noModified = ifModifiedSince
          && parseInt(new Date(ifModifiedSince).getTime() / 1000 as any) == parseInt(modifiedDate.getTime() / 1000 as any);
          
        setRange({ length });
        let rsOpt: any = {};
        if (streamOpt) {
          rsOpt.start = streamOpt.start;
          rsOpt.end = streamOpt.end;
        }
        stream = fs.createReadStream(filename, rsOpt);
      }
    }
    if (!stream) return null;
    return {
      stream,
      length,
      range,
      contentType,
      modifiedDate,
      noModified,
      streamOpt
    };
  }

  static async query(data: ValidSchema.ListBase & { fileType?: string }, opt: { user: LoginUser, host?: string }) {
    let { user } = opt;
    let cond: any = {
      userId: user._id,
      isUserDel: { $ne: true }
    };
    if (data.fileType)
      cond.fileType = data.fileType;
    let rs = await FileModel.findAndCountAll({
      ...BaseMapper.getListOptions(data),
      conditions: cond
    });
    let rows = rs.rows.map(ele => {
      let obj = ele._doc as typeof ele._doc & { url?: string };
      obj.url = this.getImgUrl(ele._id, opt.host);
      return obj;
    });
    return {
      ...rs,
      rows
    };
  }
}