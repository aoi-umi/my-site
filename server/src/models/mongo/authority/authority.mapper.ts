import { Types } from 'mongoose';

import * as ValidSchema from '@/valid-schema/class-valid';
import { escapeRegExp } from '@/_system/common';

import { BaseMapper } from '../_base';
import { AuthorityModel } from '.';

export class AuthorityMapper {
    static async codeExists(code: string, _id?: any) {
        let cond: any = { code };
        if (_id) {
            cond._id = { $ne: Types.ObjectId(_id) };
        }
        let rs = await AuthorityModel.findOne(cond);
        return rs;
    }

    static async query(data: ValidSchema.AuthorityQuery) {
        let query: any = {};
        if (data.anyKey) {
            delete data.name;
            delete data.code;
            let anykey = new RegExp(escapeRegExp(data.anyKey), 'i');
            query.$or = [
                { code: anykey },
                { name: anykey },
            ];
        }

        if (data.name)
            query.name = new RegExp(escapeRegExp(data.name), 'i');
        if (data.code)
            query.code = new RegExp(escapeRegExp(data.code), 'i');
        if (data.status)
            query.status = { $in: data.status.split(',') };

        let rs = await AuthorityModel.findAndCountAll({
            conditions: query,
            getAll: data.getAll,
            ...BaseMapper.getListOptions(data),
        });

        let rows = rs.rows.map(ele => new AuthorityModel(ele).toJSON());
        return {
            ...rs,
            rows
        };
    }
}