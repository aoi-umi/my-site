import { Types } from 'mongoose';

import * as ValidSchema from '@/valid-schema/class-valid';
import { escapeRegExp } from '@/_system/common';
import { getObjectId } from '@/helpers';

import { BaseMapper } from '../_base';
import { AuthorityModel } from '.';

export class AuthorityMapper {
  static async codeExists(code: string, _id?: any) {
    let cond: any = { code };
    if (_id) {
      cond._id = { $ne: getObjectId(_id) };
    }
    let rs = await AuthorityModel.findOne(cond);
    return rs;
  }

  static async query(data: ValidSchema.AuthorityQuery) {
    let query: any = {};
    if (data.anyKey) {
      let anykey = new RegExp(escapeRegExp(data.anyKey), 'i');
      query.$or = [{ code: anykey }, { name: anykey }];
    }

    query = {
      ...query,
      ...BaseMapper.getLikeCond(data, ['name', 'code']),
    };

    if (data.status) query.status = { $in: data.status.split(',') };

    let rs = await AuthorityModel.findAndCountAll({
      conditions: query,
      getAll: data.getAll,
      ...BaseMapper.getListOptions(data),
    });

    let rows = rs.rows.map((ele) => new AuthorityModel(ele).toJSON());
    return {
      ...rs,
      rows,
    };
  }
}
