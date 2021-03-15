
import * as config from '@/config';
import { myEnum } from '@/config';
import { paramsValid } from '@/helpers';
import * as ValidSchema from '@/valid-schema/class-valid';
import { MyRequestHandler } from '@/middleware';

import { GoodsMapper } from '@/models/mongo/goods';
import { error } from '@/_system/common';
import { Auth } from '@/_system/auth';

export const mgtSave: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.GoodsMgtSave);
    let user = opt.myData.user;
    let rs = await GoodsMapper.mgtSave(data, { user });
    return {
        _id: rs.spu._id
    };
};

export const mgtDetailQuery: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.GoodsMgtDetailQuery);
    let myData = opt.myData;
    let user = myData.user;
    let rs = await GoodsMapper.detailQuery(data);
    if (!user.equalsId(rs.spu.userId)) {
        throw error('', config.error.NO_PERMISSIONS);
    }

    let ret = rs.toJSON();
    GoodsMapper.resetDetail(ret, {
        imgHost: myData.imgHost,
        user,
    });
    return ret;
};

export const mgtQuery: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.GoodsMgtQuery);
    let myData = opt.myData;
    let user = myData.user;
    let { rows, total } = await GoodsMapper.query(data, {
        user,
        audit: Auth.contains(user, [config.auth.goodsMgtAudit]),
        resetOpt: {
            imgHost: myData.imgHost,
            user,
        }
    });
    return {
        rows,
        total,
    };
};

export let mgtDel: MyRequestHandler = async (opt) => {
    let user = opt.myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.GoodsMgtDel);
    await GoodsMapper.updateStatus({
        cond: {
            idList: data.idList,
            includeUserId: Auth.contains(user, config.auth.goodsMgtAudit) ? null : user._id,
            status: { $ne: myEnum.goodsStatus.已删除 },
        },
        toStatus: myEnum.goodsStatus.已删除, user,
    });
};

export const detailQuery: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.GoodsDetailQuery);
    let myData = opt.myData;
    let user = myData.user;
    let rs = await GoodsMapper.detailQuery(data, { normal: true });

    let ret = rs.toJSON();
    GoodsMapper.resetDetail(ret, {
        imgHost: myData.imgHost,
        user,
    });
    return ret;
};

export const query: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.GoodsQuery);
    let myData = opt.myData;
    let user = myData.user;
    let { rows, total } = await GoodsMapper.query(data, {
        user,
        normal: true,
        resetOpt: {
            imgHost: myData.imgHost,
            user,
        }
    });
    return {
        rows,
        total,
    };
};

export const buy: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.GoodsBuy);
    let myData = opt.myData;
    let user = myData.user;
    let rs = await GoodsMapper.buy(data, { user });
    return rs;
};