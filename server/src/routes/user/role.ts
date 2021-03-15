
import { paramsValid } from '@/helpers';
import { error } from '@/_system/common';
import * as config from '@/config';
import * as ValidSchema from '@/valid-schema/class-valid';
import { MyRequestHandler } from '@/middleware';

import { RoleModel, RoleInstanceType, RoleMapper } from '@/models/mongo/role';

export let query: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.RoleQuery);
    let { rows, total } = await RoleMapper.query({ ...data, includeDelAuth: true });
    return {
        rows,
        total
    };
};

export let codeExists: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.RoleCodeExists);
    let rs = await RoleMapper.codeExists(data.code, data._id);
    return rs && { _id: rs._id };
};

export let save: MyRequestHandler = async (opt) => {
    let data: {
        _id?: string;
        name?: string;
        code?: string;
        status?: string;
        delAuthList?: string[];
        addAuthList?: string[];
    } = opt.reqData;
    let detail: RoleInstanceType;
    let rs = await RoleMapper.codeExists(data.code, data._id);
    if (rs)
        throw error('code已存在');
    if (!data._id) {
        delete data._id;
        detail = await RoleModel.create({
            ...data,
            authorityList: data.addAuthList,
        });
    } else {
        detail = await RoleModel.findById(data._id);
        if (!detail)
            throw error('not exists');
        let update: any = {};
        ['name', 'code', 'status'].forEach(key => {
            update[key] = data[key];
        });

        if (data.delAuthList?.length) {
            detail.authorityList = detail.authorityList.filter(ele => !data.delAuthList.includes(ele));
        }
        if (data.addAuthList?.length) {
            detail.authorityList = [...detail.authorityList, ...data.addAuthList];
        }
        update.authorityList = detail.authorityList;
        await detail.update(update);
    }
    return {
        _id: detail._id
    };
};

export let update: MyRequestHandler = async (opt) => {
    let data: {
        _id: string;
        status?: string;
    } & Object = opt.reqData;
    let model = await RoleModel.findById(data._id);
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
    let data = paramsValid(opt.reqData, ValidSchema.RoleDel);
    let rs = await RoleModel.deleteMany({ _id: { $in: data.idList } });
    if (!rs.n)
        throw error('', config.error.NO_MATCH_DATA);
};