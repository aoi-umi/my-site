import { Types } from 'mongoose';
import * as path from 'path';
import * as fs from 'fs';

import * as common from '@/_system/common';
import * as config from '@/dev-config';
import { myEnum } from '@/dev-config';
import * as ValidSchema from '@/valid-schema/class-valid';
import { LoginUser } from '@/models/login-user';

import { BaseMapper } from '../_base';
import { UserDocType, UserMapper } from '../user';

import { FileModel, FileInstanceType } from './file';
import { FileDiskInstance, FileDiskModel } from './file-disk';

const Prefix = {
  [myEnum.fileType.图片]: config.env.imgPrefix,
  [myEnum.fileType.视频]: config.env.videoPrefix,
  [myEnum.fileType.RAW]: config.env.rawFilePrefix,
};

type RawFileType = {
  type: string;
  _id: Types.ObjectId;
  length: number;
  modifiedDate: Date;
  filename: string;
  md5: string;
  contentType: string;
  filepath?: string;
  isDel?: boolean;
};

type UploadOption = {
  contentType: string;
  filename: string;
  user: LoginUser | UserDocType;
  imgHost?: string;
};
export class FileMapper {
  static getUrl(
    _id,
    fileType: string,
    opt?: {
      host?: string;
      isRaw?: boolean;
    },
  ) {
    if (!_id) return '';
    opt = {
      ...opt,
    };
    let host = opt.host;
    if (host) {
      host = '//' + host;
    }
    let url = Prefix[fileType];
    let params: any = {
      _id,
    };
    if (opt.isRaw) params.isRaw = true;
    return !url
      ? ''
      : host +
          url +
          '?' +
          Object.entries(params)
            .filter((o) => o[1])
            .map((o) => `${o[0]}=${o[1]}`)
            .join('&');
  }

  static getImgUrl(_id, host?: string) {
    return this.getUrl(_id, myEnum.fileType.图片, { host });
  }

  static getVideoUrl(_id, host?: string) {
    return this.getUrl(_id, myEnum.fileType.视频, { host });
  }

  private static async findRaw(cond) {
    let rawFileList = await FileModel.rawFind(cond);
    let rawDiskFileList = await FileDiskModel.find(cond);
    let rs: RawFileType[] = [];
    rawDiskFileList?.forEach((ele) => {
      let filename = this.getDiskFilePath(ele.md5);
      if (fs.existsSync(filename)) {
        let stat = fs.statSync(filename);
        rs.push({
          type: myEnum.fileStorgeType.硬盘,
          _id: ele._id,
          length: ele.length,
          contentType: ele.contentType,
          filename: ele.filename,
          md5: ele.md5,
          modifiedDate: stat.mtime,
          filepath: filename,
          isDel: ele.isDel,
        });
      }
    });
    rawFileList?.forEach((ele) => {
      rs.push({
        type: myEnum.fileStorgeType.数据库,
        _id: ele._id,
        length: ele.length,
        contentType: ele.contentType,
        filename: ele.filename,
        md5: ele.md5,
        modifiedDate: ele.uploadDate,
      });
    });
    return rs;
  }

  static async findWithRaw(cond) {
    let fileList = await FileModel.find(cond);
    let rawFileList: RawFileType[] = [];
    if (fileList.length) {
      rawFileList = await this.findRaw({
        _id: { $in: fileList.map((ele) => ele.fileId) },
      });
    }
    return fileList.map((file) => {
      let rawFile = rawFileList.find((raw) => raw._id.equals(file.fileId));
      return {
        file,
        rawFile,
      };
    });
  }

  private static getDiskFilePath(...args) {
    return path.resolve(config.env.filePath, ...args);
  }

  private static async saveFileToDisk(opt: {
    data: Buffer;
    filename: string;
    overwite?: boolean;
  }) {
    let filename = this.getDiskFilePath(opt.filename);
    if (!fs.existsSync(filename) || opt.overwite) {
      await common.writeFile([{ data: opt.data }], filename);
    }
    return {
      fullFilename: filename,
    };
  }

  private static async saveFileToDiskDefault(opt: {
    data: Buffer;
    contentType: string;
  }) {
    let { data, contentType } = opt;
    let md5 = common.md5(data);
    let length = data.length;
    let saveRs = await this.saveFileToDisk({
      filename: md5,
      data,
    });
    let fd = await this.findOrCreateDiskFileRow({
      md5,
      filename: md5,
      length,
      contentType,
    });
    return {
      md5,
      fullFilename: saveRs.fullFilename,
      fileId: fd._id,
      length,
    };
  }

  static async findOrCreateDiskFileRow(opt: {
    filename: string;
    contentType: string;
    length: number;
    md5: string;
  }) {
    let fd = await FileDiskModel.findOne({ md5: opt.md5 });
    if (!fd) {
      fd = await FileDiskModel.create({
        ...opt,
      });
    }
    return fd;
  }

  static async upload(
    opt: {
      fileType: string;
      buffer: Buffer;
    } & UploadOption,
  ) {
    let fileContentType = opt.contentType.split('/')[0];
    if (
      (opt.fileType === myEnum.fileType.视频 && fileContentType !== 'video') ||
      (opt.fileType === myEnum.fileType.图片 && fileContentType !== 'image')
    )
      throw common.error('错误的文件类型');

    let fileObj = await this.saveFileToDiskDefault({
      data: opt.buffer,
      contentType: opt.contentType,
    });

    let obj = await this.saveByUser({
      ...opt,
      length: fileObj.length,
      md5: fileObj.md5,
    });
    return obj;
  }

  static async saveByUser(
    opt: {
      fileType: string;
      md5: string;
      length: number;
    } & UploadOption,
  ) {
    let { user, contentType, md5, length } = opt;
    let fs = new FileModel({
      filename: opt.filename,
      fileType: opt.fileType,
    });
    if (user) {
      fs.userId = user._id;
      fs.nickname = user.nickname;
      fs.account = user.account;
    }
    let fd = await this.findOrCreateDiskFileRow({
      md5,
      filename: md5,
      length,
      contentType,
    });
    fs.fileId = fd._id;
    fs.storageDisk = true;
    await fs.save();

    let obj = fs.toOutObject();
    obj.url = FileMapper.getUrl(fs._id, opt.fileType, { host: opt.imgHost });
    return obj;
  }

  private static chunksDir = 'chunks';

  static async uploadCheck(
    opt: {
      hash: string;
      fileSize: number;
      chunkSize: number;
    } & UploadOption,
  ) {
    let { chunkSize } = opt;
    let existsChunks = [],
      requiredChunks = [];
    let filename = this.getDiskFilePath(opt.hash);
    let exists = fs.existsSync(filename);
    let chunkFileDir = this.getDiskFilePath(this.chunksDir, opt.hash);
    if (!exists) {
      // 获取已有chunk
      if (!fs.existsSync(chunkFileDir))
        fs.mkdirSync(chunkFileDir, { recursive: true });
      existsChunks = fs.readdirSync(chunkFileDir);
      // 按index，排除已存在的
      let allChunks = new Array(Math.ceil(opt.fileSize / chunkSize))
        .fill(0)
        .map((ele, idx) => idx);
      requiredChunks = allChunks.filter((ele) => {
        return !existsChunks.includes(ele.toString());
      });
      // 合并文件
      if (!requiredChunks.length) {
        let outFile = this.getDiskFilePath(this.chunksDir, opt.hash, opt.hash);
        let sources = allChunks.map((inFile) => {
          return {
            filePath: this.getDiskFilePath(
              this.chunksDir,
              opt.hash,
              inFile.toString(),
            ),
          };
        });
        await common.writeFile(sources, outFile);
        let md5 = await common.md5File(outFile);
        if (opt.hash === md5) {
          fs.renameSync(outFile, filename);
        } else {
          throw new Error('hash not match');
        }
      }
    }
    // 保存到db
    let fileObj;
    if (fs.existsSync(filename)) {
      common.delDir(chunkFileDir);
      let stat = fs.statSync(filename);
      let fileContentType = opt.contentType.split('/')[0];
      let fileType =
        {
          video: myEnum.fileType.视频,
          image: myEnum.fileType.图片,
        }[fileContentType] || '';
      fileObj = await this.saveByUser({
        ...opt,
        md5: opt.hash,
        fileType,
        length: stat.size,
      });
    }
    return {
      chunkSize,
      requiredChunks,
      fileObj,
    };
  }

  static async uploadByChunks(
    opt: {
      hash: string;
      chunkIndex: string;
      buffer: Buffer;
    } & UploadOption,
  ) {
    let prefix = ''; //'chunk_';
    await this.saveFileToDisk({
      data: opt.buffer,
      filename: path.join(this.chunksDir, opt.hash, prefix, opt.chunkIndex),
    });
  }

  /**
  目前有两种存储方式，一种存在数据库，一种存在disk
  */
  static async download(
    data: ValidSchema.FileGet,
    opt: {
      fileType?: string;
      range?: {
        start: number;
        end: number;
      };
      ifModifiedSince?: string;
      mgt?: boolean;
    },
  ) {
    let rawFile: RawFileType;
    let range: { start: number; end: number };
    let { ifModifiedSince } = opt;

    let rawId;
    let noModified = false;
    let filename;
    if (data.isRaw) {
      rawId = data._id;
    } else {
      let fileModel = await FileModel.findOne({
        _id: data._id,
        fileType: opt.fileType,
      });
      if (fileModel) {
        rawId = fileModel.fileId;
        filename = fileModel.filename;
      }
    }
    if (rawId) {
      let list = await this.findRaw({ _id: rawId });
      rawFile = list[0];
    }
    if (!rawFile) return;
    if (rawFile.isDel && !opt.mgt) return;

    let stream: NodeJS.ReadableStream;
    let streamOpt;
    const setRange = () => {
      let { length } = rawFile;
      if (opt.range) {
        range = {
          start: opt.range.start,
          end: opt.range.end || length - 1,
        };
        streamOpt = {
          start: range.start,
          end: range.end + 1,
        };
      }
    };
    if (rawFile.type === myEnum.fileStorgeType.数据库) {
      setRange();
      let downloadOpt: any = {
        returnStream: true,
      };
      if (range) {
        downloadOpt.streamOpt = streamOpt;
      } else if (ifModifiedSince) {
        downloadOpt.ifModifiedSince = ifModifiedSince;
      }
      let rs = await new FileModel({ fileId: rawFile._id }).download(
        downloadOpt,
      );
      stream = rs.stream;
      noModified = rs.noModified;
    } else if (rawFile.type === myEnum.fileStorgeType.硬盘) {
      let { modifiedDate, filepath: filename } = rawFile;
      setRange();
      noModified =
        ifModifiedSince &&
        parseInt((new Date(ifModifiedSince).getTime() / 1000) as any) ==
          parseInt((modifiedDate.getTime() / 1000) as any);

      let rsOpt: any = {};
      if (streamOpt) {
        rsOpt.start = streamOpt.start;
        rsOpt.end = streamOpt.end;
      }
      stream = fs.createReadStream(filename, rsOpt);
    }
    if (!stream) return;
    return {
      length: rawFile.length,
      contentType: rawFile.contentType,
      modifiedDate: rawFile.modifiedDate,
      stream,
      range,
      noModified,
      filename,
    };
  }

  static async query(
    data: ValidSchema.ListBase & { fileType?: string },
    opt: { user: LoginUser; host?: string; mgt?: boolean },
  ) {
    let { user } = opt;
    let cond: any = {};
    if (!opt.mgt) {
      cond = {
        userId: user._id,
        isUserDel: { $ne: true },
      };
    }
    if (data.fileType) cond.fileType = data.fileType;
    let pipeline = [...UserMapper.lookupPipeline(), { $match: cond }];
    let rs = await FileModel.aggregatePaginate(pipeline, {
      ...BaseMapper.getListOptions(data),
    });
    let rows = rs.rows.map((ele) => {
      let obj = ele as typeof ele & { url?: string };
      obj.url = this.getUrl(ele._id, ele.fileType, { host: opt.host });
      return obj;
    });
    return {
      ...rs,
      rows,
    };
  }

  static async diskFileQuery(
    data: ValidSchema.FileList,
    opt: { host?: string },
  ) {
    let cond: any = {};
    ['md5'].forEach((key) => {
      if (data[key])
        cond[key] = new RegExp(common.escapeRegExp(data[key]), 'i');
    });
    let pipeline = [
      {
        $match: cond,
      },
    ];
    let rs = await FileDiskModel.aggregatePaginate(pipeline, {
      ...BaseMapper.getListOptions(data),
    });
    let rows = rs.rows.map((ele) => {
      let obj = ele as typeof ele & { url?: string; fileType?: string };
      let fileType = ele.contentType?.split('/')[0];
      obj.fileType = fileType;
      obj.url = this.getUrl(ele._id, myEnum.fileType.RAW, { host: opt.host });
      return obj;
    });
    return {
      ...rs,
      rows,
    };
  }

  static async diskFileOperate(
    data: ValidSchema.OperateBase,
    opt: { operate: string },
  ) {
    await FileDiskModel.updateMany(
      { _id: data.idList },
      {
        isDel: opt.operate === myEnum.fileOperate.删除 ? true : false,
      },
    );
  }
}
