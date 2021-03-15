import { paramsValid } from '@/helpers';
import * as ValidSchema from '@/valid-schema/class-valid';
import { MyRequestHandler } from '@/middleware';
import { error } from '@/_system/common';
import * as config from '@/config';

import { PrintMapper, PrintModel } from '@/models/mongo/print';

export const mgtQuery: MyRequestHandler = async (opt) => {
    let rs = await PrintMapper.query(opt.reqData, { user: opt.myData.user });
    return { rows: rs.rows, total: rs.total };
};

export const mgtDetailQuery: MyRequestHandler = async (opt) => {
    let rs = await PrintMapper.detailQuery(opt.reqData, { user: opt.myData.user });
    return rs;
};

export const mgtSave: MyRequestHandler = async (opt) => {
    let rs = await PrintMapper.save(opt.reqData, { user: opt.myData.user });
    return { _id: rs._id };
};

export const mgtDel: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.PrintDel);
    let rs = await PrintModel.deleteMany({ _id: { $in: data.idList } });
    if (!rs.n)
        throw error('', config.error.NO_MATCH_DATA);
};