
import { paramsValid } from '@/helpers';
import * as config from '@/config';
import { error } from '@/_system/common';
import * as ValidSchema from '@/valid-schema/class-valid';
import { MyRequestHandler } from '@/middleware';

import { AuthorityModel, AuthorityInstanceType, AuthorityMapper } from '@/models/mongo/authority';

export let query: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.AuthorityQuery);
    let { rows, total } = await AuthorityMapper.query(data);

    return {
        rows,
        total
    };
};

export let codeExists: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.AuthorityCodeExists);
    let rs = await AuthorityMapper.codeExists(data.code, data._id);
    return rs && { _id: rs._id };
};

export let save: MyRequestHandler = async (opt) => {
    let data: {
        _id?: string;
        name?: string;
        code?: string;
        status?: string;
    } = opt.reqData;
    let model: AuthorityInstanceType;
    let rs = await AuthorityMapper.codeExists(data.code, data._id);
    if (rs)
        throw error('code已存在');
    if (!data._id) {
        delete data._id;
        model = await AuthorityModel.create({
            ...data,
        });
    } else {
        model = await AuthorityModel.findById(data._id);
        if (!model)
            throw error('not exists');
        let update: any = {};
        ['name', 'code', 'status'].forEach(key => {
            update[key] = data[key];
        });
        await model.update(update);
    }
    return {
        _id: model._id
    };
};

export let update: MyRequestHandler = async (opt) => {
    let data: {
        _id: string;
        status?: string;
    } & Object = opt.reqData;
    let model = await AuthorityModel.findById(data._id);
    if (!model)
        throw error('not exists');
    let update: any = {};
    ['status'].forEach(key => {
        if (data.hasOwnProperty(key))
            update[key] = data[key];
    });
    await model.update(update);

    return {
        _id: model._id
    };
};

export let del: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.AuthorityDel);
    let rs = await AuthorityModel.deleteMany({ _id: { $in: data.idList } });
    if (!rs.n)
        throw error('', config.error.NO_MATCH_DATA);
};