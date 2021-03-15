
import { paramsValid } from '@/helpers';
import { ThirdPartyPayMapper } from '@/3rd-party';
import * as ValidSchema from '@/valid-schema/class-valid';
import { MyRequestHandler } from '@/middleware';

import { PayModel, AssetLogModel, PayMapper } from '@/models/mongo/asset';

export let submit: MyRequestHandler = async (opt) => {
    let user = opt.myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.PaySubmit);
    let pay = await PayModel.findOne({ _id: data._id, userId: user._id });
    let assetLog = await AssetLogModel.findById(pay.assetLogId);
    return {
        url: assetLog.req
    };
};

export let cancel: MyRequestHandler = async (opt) => {
    let user = opt.myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.PayCancel);
    return PayMapper.cancel(data, { user });
};

export let query: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.PayQuery);
    let rs = await PayMapper.query(data, { user: opt.myData.user, imgHost: opt.myData.imgHost });
    return { rows: rs.rows, total: rs.total };
};

export let refundApply: MyRequestHandler = async (opt) => {
    let user = opt.myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.PayRefundApply);
    let rs = await PayMapper.refundApply(data, { user });
    return rs.pay;
};

export let refund: MyRequestHandler = async (opt) => {
    let user = opt.myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.PayRefund);
    let rs = await ThirdPartyPayMapper.refund({ _id: data._id });
    return rs.pay;
};