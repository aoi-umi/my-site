
import { paramsValid } from '@/helpers';
import * as ValidSchema from '@/valid-schema/class-valid';
import { ThirdPartyPayMapper } from '@/3rd-party';
import { MyRequestHandler } from '@/middleware';

import { NotifyMapper } from '@/models/mongo/notify';
import { AssetLogMapper } from '@/models/mongo/asset';

export const notifyQuery: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.AssetNotifyQuery);
    let { rows, total } = await NotifyMapper.query(data);
    return {
        rows,
        total
    };
};

export const notifyRetry: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.AssetNotifyRetry);
    await ThirdPartyPayMapper.notifyHandler({ notifyId: data._id });
};

export const logQuery: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.AssetLogQuery);

    let { rows, total } = await AssetLogMapper.query(data);
    return {
        rows,
        total
    };
};