import { LoginUser } from '@/models/login-user';
import * as ValidSchema from '@/valid-schema/class-valid';
import { escapeRegExp } from '@/_system/common';
import { transaction } from '@/_system/dbMongo';
import { BaseMapper } from '../_base';

import { CompInstanceType, CompModel, } from './comp';
import { CompConfigInstanceType, CompConfigModel, } from './comp-config';

export class CompMapper {
  static async query(data, opt: {
    user: LoginUser
  }) {
    let query: any = {}, $and = [];

    if (data.name)
      query.name = new RegExp(escapeRegExp(data.name), 'i');
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
    let main = await CompModel.findById(data._id);
    let config = await CompConfigModel.find({compId: main._id});
    return {
      main,
      config
    };
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
      detail = await CompModel.findOne({ _id: data._id });
      if (detail.userId && !opt.user.equalsId(detail.userId))
        throw new Error('无权限修改');
      let update: any = {};
      ['name', 'data'].forEach(key => {
        console.log(key);
        update[key] = data[key];
      });
      await transaction(async (session) => {
        await detail.update(update, {session});
      });
    }
    return detail;
  }
}