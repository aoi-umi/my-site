import { paramsValid } from '@/helpers';
import * as ValidSchema from '@/valid-schema/class-valid';
import { MyRequestHandler } from '@/middleware';
import { error } from '@/_system/common';
import * as config from '@/dev-config';

import { CompMapper, CompModel } from '@/models/mongo/comp';

export const mgtQuery: MyRequestHandler = async (opt) => {
  let rs = await CompMapper.query(opt.reqData, { user: opt.myData.user });
  return { rows: rs.rows, total: rs.total };
};

export const mgtDetailQuery: MyRequestHandler = async (opt) => {
  let rs = await CompMapper.mgtDetailQuery(opt.reqData, { user: opt.myData.user });
  return rs;
};

export const mgtSave: MyRequestHandler = async (opt) => {
  let rs = await CompMapper.save(opt.reqData, { user: opt.myData.user });
  return { _id: rs._id };
};

export const mgtModuleSave: MyRequestHandler = async (opt) => {
  let rs = await CompMapper.moduleSave(opt.reqData, { user: opt.myData.user });
  return rs;
};

export const mgtConfigSave: MyRequestHandler = async (opt) => {
  let rs = await CompMapper.configSave(opt.reqData, { user: opt.myData.user });
  return rs;
};

export const mgtConfigQuery: MyRequestHandler = async (opt) => {
  let rs = await CompMapper.configQuery(opt.reqData, { user: opt.myData.user });
  return rs;
};

export const mgtDel: MyRequestHandler = async (opt) => {
  let data = opt.reqData;
  let rs = await CompMapper.del({ _id: data.idList}, {user: opt.myData.user});
};

export const detailQuery: MyRequestHandler = async (opt) => {
  let rs = await CompMapper.detailQuery(opt.reqData, { user: opt.myData.user, preview: true });
  return rs;
};