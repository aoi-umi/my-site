import { LoginUser } from '@/models/login-user';
import * as ValidSchema from '@/valid-schema/class-valid';
import { error, escapeRegExp } from '@/_system/common';
import { transaction } from '@/_system/dbMongo';
import * as config from '@/config';
import { BaseMapper } from '../_base';

import { CompInstanceType, CompModel, } from './comp';
import { CompItemInstanceType, CompItemModel, } from './comp-item';
import { CompModuleModel } from './comp-module';
import { CompButtonModel } from './comp-button';

type DetailQueryOptType = {
  user: LoginUser,
  preview?: boolean
}
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

  static async mgtDetailQuery(data, opt: DetailQueryOptType) {
    let main = await this.findDetail(data, opt);
    let moduleList = await CompModuleModel.find({ compId: main._id }).sort({
      sort: 1
    });
    return {
      main,
      moduleList,
    };
  }

  static async detailQuery(data, opt: DetailQueryOptType) {
    let main = await this.findDetail(data, opt);
    let moduleList = await CompModuleModel.find({ compId: main._id }).sort({
      sort: 1
    });
    let itemList = await CompItemModel.find({ compId: main._id }).sort({
      sort: 1
    });
    let buttonList = await CompButtonModel.find({ compId: main._id }).sort({
      sort: 1
    });
    let moduleListDoc = moduleList.map(ele => {
      let json = ele.toJSON();
      json.itemList = itemList.filter(cfg => cfg.moduleId.equals(ele._id));
      json.buttonList = buttonList.filter(cfg => cfg.moduleId.equals(ele._id));
      return json;
    });
    return {
      main,
      moduleList: moduleListDoc,
    };
  }

  private static async findDetail(data: { _id?: any, name?: any }, opt: DetailQueryOptType) {
    let cond: any = {};
    if (data._id)
      cond._id = data._id;
    else if (data.name)
      cond.name = data.name;
    else
      throw new Error('缺少参数');
    let detail = await CompModel.findOne(cond);
    if (!detail)
      throw error('', config.error.DB_NO_DATA);
    let checkPer = !opt.preview;
    if (checkPer) {
      if (detail.userId && !opt.user.equalsId(detail.userId))
        throw new Error('无权限处理');
    }
    return detail;
  }

  static async save(data: any, opt: {
    user: LoginUser
  }) {
    let detail: CompInstanceType;
    let existsCond: any = { name: data.name };
    if (data._id)
      existsCond._id = { $ne: data._id };
    let exists = await CompModel.findOne(existsCond);
    if (exists)
      throw new Error(`[${data.name}]已存在`);
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
    data.moduleList.forEach((ele, idx) => {
      ele.compId = detail._id;
      ele.sort = idx;
      if (ele._id)
        delModule.$nin.push(ele._id);
    });
    let moduleList;
    await transaction(async (session) => {
      let rs = await Promise.all([
        CompModuleModel.deleteMany({ compId: detail._id }, { session }),
        CompItemModel.deleteMany({ compId: detail._id, moduleId: delModule }, { session }),
        CompButtonModel.deleteMany({ compId: detail._id, moduleId: delModule }, { session }),
      ]);
      moduleList = await CompModuleModel.create(data.moduleList, { session });
    });
    return { moduleList };
  }

  static async configQuery(data: any, opt: {
    user: LoginUser
  }) {
    let itemList = await CompItemModel.find(data).sort({
      sort: 1
    });
    let buttonList = await CompButtonModel.find(data).sort({
      sort: 1
    });
    return {
      itemList,
      buttonList
    };
  }

  static async configSave(data: any, opt: {
    user: LoginUser
  }) {
    let detail = await this.findDetail({ _id: data.compId }, opt);

    data.itemList.forEach((ele, idx) => {
      ele.compId = detail._id;
      ele.moduleId = data.moduleId;
      ele.sort = idx;
    });
    data.buttonList.forEach((ele, idx) => {
      ele.compId = detail._id;
      ele.moduleId = data.moduleId;
      ele.sort = idx;
    });
    let itemList, buttonList;
    await transaction(async (session) => {
      let rs = await Promise.all([
        CompItemModel.deleteMany({ compId: detail._id, moduleId: data.moduleId }, { session }),
        CompButtonModel.deleteMany({ compId: detail._id, moduleId: data.moduleId }, { session }),
      ]);
      let saveRs = await Promise.all([
        CompItemModel.create(data.itemList, { session }),
        CompButtonModel.create(data.buttonList, { session }),
      ]);
      itemList = saveRs[0] || [];
      buttonList = saveRs[1] || [];
    });
    return { itemList, buttonList };
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
        CompItemModel.deleteMany({ compId: id }, { session }),
        CompButtonModel.deleteMany({ compId: id }, { session })
      ]);
    });
  }
}