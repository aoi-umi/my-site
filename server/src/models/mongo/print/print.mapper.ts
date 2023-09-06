import { LoginUser } from '@/models/login-user';
import * as ValidSchema from '@/valid-schema/class-valid';
import { escapeRegExp } from '@/_system/common';
import { error } from '@/_system/common';
import { UserModel } from '../user';
import { BaseMapper } from '../_base';

import { PrintInstanceType, PrintModel } from './print';
export class PrintMapper {
  static getQueryCond(
    data: ValidSchema.PrintQuery,
    opt: {
      user: LoginUser;
    },
  ) {
    let query = BaseMapper.getLikeCond(data, ['name', 'text']);

    if (data.idList) query.idList = query.idList;

    let $or = [{ userId: null }];
    if (opt.user.isLogin) {
      $or.push({ userId: opt.user._id });
    }
    let $and = [];
    $and.push({
      $or,
    });
    if ($and.length) query.$and = $and;
    return query;
  }

  static async query(
    data: ValidSchema.PrintQuery,
    opt: {
      user: LoginUser;
    },
  ) {
    let query = this.getQueryCond(data, opt);
    let rs = await PrintModel.findAndCountAll({
      ...BaseMapper.getListOptions(data),
      conditions: query,
      projection: { data: 0 },
    });
    return rs;
  }

  static async export(
    data: ValidSchema.PrintQuery,
    opt: {
      user: LoginUser;
    },
  ) {
    let query = this.getQueryCond(data, opt);
    let rsData = await PrintModel.find(query);
    let user = await UserModel.find({
      _id: rsData.filter((ele) => ele.userId).map((ele) => ele.userId),
    });
    return rsData.map((ele) => {
      let data = ele.toJSON();
      let obj = data as typeof data & {
        user?: string;
      };
      let u = user.find((u) => u._id.equals(ele.userId));
      obj.user = u?.account || '';
      return obj;
    });
  }

  static async detailQuery(
    data: ValidSchema.PrintDetailQuery,
    opt: {
      user: LoginUser;
    },
  ) {
    let rs = await PrintModel.findById(data._id);
    return rs;
  }

  static async save(
    data: any,
    opt: {
      user: LoginUser;
    },
  ) {
    let detail: PrintInstanceType;
    if (!data._id) {
      delete data._id;
      if (opt.user.isLogin) data.userId = opt.user._id;
      detail = new PrintModel(data);
      await detail.save();
    } else {
      detail = await PrintModel.findOne({ _id: data._id });
      if (detail.userId && !opt.user.equalsId(detail.userId))
        throw new Error('无权限修改');
      let update: any = {};
      ['name', 'text', 'data'].forEach((key) => {
        update[key] = data[key];
      });
      await detail.updateOne(update);
    }
    return detail;
  }

  static getPrintLogic(type) {
    let logic = printLogic[type];
    if (!logic) throw error(`错误的打印类型[${type}]`);
    return logic;
  }

  static async execPrintLogic(opt: { type: string; data: any }) {
    let logic = this.getPrintLogic(opt.type);
    return logic(opt.data);
  }

  static setPrintLogic(type, fn: GetPrintDataType) {
    if (printLogic[type]) throw error(`打印类型[${type}]已存在`);
    printLogic[type] = fn;
  }
}

type ArrayOrSelf<T> = Array<T> | T;
type PromiseOrSelf<T> = Promise<T> | T;
type PrintDataType = {
  label?: string;
  template: any;
  data: any[];
};
type GetPrintDataType = (data) => PromiseOrSelf<ArrayOrSelf<PrintDataType>>;
const printLogic: { [key: string]: GetPrintDataType } = {};
