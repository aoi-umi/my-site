import { RequestHandler, Request, Response } from 'express';
import { GridFSInstance } from 'mongoose-ts-ua';
import * as multer from '@koa/multer';

import * as common from '@/_system/common';
import { paramsValid } from '@/helpers';
import { myEnum } from '@/config';
import * as ValidSchema from '@/valid-schema/class-valid';
import { FileMapper, FileModel } from '@/models/mongo/file';
import { logger } from '@/helpers';
import { MyRequestHandler } from '@/middleware';

const upload: MyRequestHandler = async (opt) => {
  let option = <{ fileType: string, file: multer.File }>opt.reqOption;
  let { myData } = opt;
  let { file } = option;

  let rs = await FileMapper.upload({
    user: myData.user,
    fileType: option.fileType,
    contentType: file.mimetype,
    buffer: file.buffer,
    filename: file.originalname,
    imgHost: myData.imgHost
  });
  return rs;
};

const download: MyRequestHandler = async (opt, ctx) => {
  let option = <{ fileType: string }>opt.reqOption;

  let data = paramsValid(opt.reqData, ValidSchema.FileGet);

  let reqRange = ctx.headers.range as string;
  let range;
  if (reqRange) {
    let pos = reqRange.replace(/bytes=/, '').split('-');
    let start = parseInt(pos[0], 10);
    let end = pos[1] ? parseInt(pos[1], 10) : 0;
    range = {
      start,
      end
    };
  }
  let ifModifiedSince = ctx.request.get('if-modified-since');
  let rs = await FileMapper.download(data, {
    fileType: option.fileType,
    range,
    ifModifiedSince
  });
  opt.noSend = true;
  if (!rs) {
    ctx.status = 404;
    return;
  }
  //分片下载
  if (rs.range) {
    let total = rs.length;
    let { start, end } = rs.range;
    let chunksize = (end - start) + 1;

    ctx.status = 206;
    ctx.set({
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize.toString(),
      'Content-Type': rs.contentType,
    });
    ctx.body = rs.stream;
  } else {
    if (rs.noModified) {
      ctx.status = 304;
      return;
    }
    ctx.set({
      'Content-Type': rs.contentType,
      'Content-Length': rs.length.toString(),
      'Content-Disposition': 'inline',
      'Last-Modified': (rs.modifiedDate || new Date()).toUTCString()
    });
    ctx.body = rs.stream;
  }
};

export const imgUpload: MyRequestHandler = (opt, ctx) => {
  opt.reqOption = { fileType: myEnum.fileType.图片, file: ctx.file };
  return upload(opt);
};

export const imgGet: MyRequestHandler = (opt, ctx) => {
  opt.reqOption = { fileType: myEnum.fileType.图片, file: ctx.file };
  return download(opt, ctx);
};

export const videoUpload: MyRequestHandler = (opt, ctx) => {
  opt.reqOption = { fileType: myEnum.fileType.视频, file: ctx.file };
  return upload(opt);
};

export const vedioGet: MyRequestHandler = (opt, ctx) => {
  opt.reqOption = { fileType: myEnum.fileType.视频, file: ctx.file };
  return download(opt, ctx);
};