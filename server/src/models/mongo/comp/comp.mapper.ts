import { LoginUser } from '@/models/login-user';
import * as ValidSchema from '@/valid-schema/class-valid';
import { error, escapeRegExp } from '@/_system/common';
import { transaction } from '@/_system/dbMongo';
import * as config from '@/config';
import { BaseMapper } from '../_base';

import { CompInstanceType, CompModel, } from './comp';
import { CompConfigInstanceType, CompConfigModel, } from './comp-config';
import { CompModuleModel } from './comp-module';

export class CompMapper {
  static async query(data, opt: {
    user: LoginUser
  }) {
    let query: any = {}, $and = [];

    ['name', 'text'].forEach(key => {
      if (data[key])
        query[key] = new RegExp(escapeRegExp(data[key]), 'i');
    });
    let $or = [{ userId: null }, ];
    if (opt.user.isLogin) {
      $or.push({ userId: opt.user._id });
    }
    $and.push({
      $or
    });
    if ($and.length)
      query.$and = $and;
    let rs = await CompModel.findAndCountAll({
      ...BaseMapper.getListOptions(data),
      conditions: query,
      projection: { data: 0 },
    });
    return rs;
  }

  static async detailQuery(data, opt: {
    user: LoginUser
  }) {
    let main = await this.findDetail(data, opt);
    let moduleList = await CompModuleModel.find({ compId: main._id });
    return {
      main,
      moduleList,
    };
  }

  private static async findDetail(data: { _id: any }, opt: {
    user: LoginUser
  }) {
    let detail = await CompModel.findOne({ _id: data._id });
    if (!detail)
      throw error('', config.error.DB_NO_DATA);
    if (detail.userId && !opt.user.equalsId(detail.userId))
      throw new Error('无权限处理');
    return detail;
  }

  static async save(data: any, opt: {
    user: LoginUser
  }) {
    let detail: CompInstanceType;
    if (!data._id) {
      delete data._id;
      if (opt.user.isLogin)
        data.userId = opt.user._id;
      detail = new CompModel(data);
      await detail.save();
    } else {
      detail = await this.findDetail(data, opt);
      let update: any = {};
      ['name', 'text'].forEach(key => {
        update[key] = data[key];
      });
      await detail.update(update);
    }
    return detail;
  }

  static async moduleSave(data: { compId: any, moduleList: any[] }, opt: {
    user: LoginUser
  }) {
    let detail = await this.findDetail({ _id: data.compId }, opt);
    let delModule = {
      $nin: []
    };
    data.moduleList.forEach(ele => {
      ele.compId = detail._id;
      if (ele._id)
        delModule.$nin.push(ele._id);
    });
    let moduleList;
    await transaction(async (session) => {
      let rs = await Promise.all([
        CompModuleModel.deleteMany({ compId: detail._id }, { session }),
        CompConfigModel.deleteMany({ compId: detail._id, moduleId: delModule }, { session }),
        CompModuleModel.create(data.moduleList, { session })
      ]);
      moduleList = rs[2];
    });
    return { moduleList };
  }

  static async configQuery(data: any, opt: {
    user: LoginUser
  }) {
    return CompConfigModel.find(data);
  }

  static async configSave(data: any, opt: {
    user: LoginUser
  }) {
    let detail = await this.findDetail({ _id: data.compId }, opt);
    
    data.configList.forEach(ele => {
      ele.compId = detail._id;
      ele.moduleId = data.moduleId;
    });
    let configList;
    await transaction(async (session) => {
      let rs = await Promise.all([
        CompConfigModel.deleteMany({ compId: detail._id, moduleId: data.moduleId }, { session }),
        CompConfigModel.create(data.configList, { session })
      ]);
      configList = rs[1];
    });
    return { configList };
  }

  static async del(data, opt: {
    user: LoginUser
  }) {
    let $or = [{ userId: null }];
    if (opt.user.isLogin) {
      $or.push({ userId: opt.user._id });
    }
    let comp = await CompModel.find({ $and: [{ _id: data._id }, { $or }] });
    let id = comp.map(ele => ele._id);
    if (!id.length) return;
    await transaction(async (session) => {
      await Promise.all([
        CompModel.deleteMany({ _id: id }, { session }),
        CompModuleModel.deleteMany({ compId: id }, { session }),
        CompConfigModel.deleteMany({ compId: id }, { session })
      ]);
    });
  }
}