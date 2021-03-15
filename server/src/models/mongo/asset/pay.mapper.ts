import { Types } from 'mongoose';

import * as helpers from '@/helpers';
import * as config from '@/config';
import { myEnum } from '@/config';
import * as ValidSchema from '@/valid-schema/class-valid';
import { Auth } from '@/_system/auth';
import { escapeRegExp, error } from '@/_system/common';
import { transaction } from '@/_system/dbMongo';
import { ThirdPartyPayMapper } from '@/3rd-party';
import { SendQueue } from '@/task';

import { LoginUser } from '../../login-user';
import { BaseMapper } from '../_base';
import { UserMapper } from '../user';
import { AssetLogMapper } from './asset-log.mapper';
import { PayModel, PayInstanceType } from './pay';
import { AssetLogModel } from './asset-log';
import { RefundModel } from './refund';
import { GoodsSkuModel } from '../goods';

export class PayMapper {
    static async query(data: ValidSchema.PayQuery, opt: {
        user: LoginUser
        imgHost?: string;
    }) {
        opt = {
            ...opt
        };
        let match: any = {};

        if (!Auth.includes(opt.user, config.auth.payMgtQuery)) {
            match.userId = opt.user._id;
        }

        if (data.status)
            match.status = { $in: data.status.split(',').map(ele => parseInt(ele)) };
        if (data.type)
            match.type = { $in: data.type.split(',').map(ele => parseInt(ele)) };
        if (data.anyKey) {
            let reg = new RegExp(escapeRegExp(data.anyKey), 'i');
            match.$or = [{
                title: reg,
            }, {
                content: reg,
            }];
        }
        let createdAt = helpers.dbDateMatch(data.createdAtFrom, data.createdAtTo).mongoDate;
        if (createdAt)
            match.createdAt = createdAt;

        let match2: any = {};
        if (data.orderNo)
            match2['assetLog.orderNo'] = new RegExp(escapeRegExp(data.orderNo), 'i');
        if (data.outOrderNo)
            match2['assetLog.outOrderNo'] = new RegExp(escapeRegExp(data.outOrderNo), 'i');

        let rs = await PayModel.aggregatePaginate<{
            user: any,
            assetLog: any,
        }>([
            { $match: match },
            ...UserMapper.lookupPipeline(),
            ...AssetLogMapper.lookupPipeline(),
            { $match: match2 },
        ], {
            ...BaseMapper.getListOptions(data)
        });
        let rows = rs.rows.map(ele => {
            let obj = new PayModel(ele).toJSON();
            UserMapper.resetDetail(ele.user, { imgHost: opt.imgHost });
            obj.user = ele.user;
            obj.orderNo = ele.assetLog.orderNo;
            obj.outOrderNo = ele.assetLog.outOrderNo || '';
            PayMapper.resetDetail(obj, { user: opt.user });
            return obj;
        });
        return {
            ...rs,
            rows
        };
    }

    static resetDetail(detail, opt: { user: LoginUser }) {
        if (!opt.user.equalsId(detail.userId)) {
            detail.canPay = detail.canCancel = detail.canRefundApply = false;
        }
        if (!Auth.contains(opt.user, config.auth.payMgtOperate)) {
            detail.canRefund = false;
        }
    }

    static async queryOne(match) {
        let detail = await PayModel.findOne(match);
        if (!detail)
            throw error('', config.error.NO_MATCH_DATA);
        return detail;
    }

    static async cancel(data: ValidSchema.PayCancel, opt: { auto?: boolean, user?: LoginUser }) {
        let { user, auto } = opt;
        let match: any = { _id: data._id };
        if (!auto)
            match.userId = user._id;
        let detail = await PayMapper.queryOne(match);
        if (detail.status !== myEnum.payStatus.已取消) {
            if (!detail.canCancel) {
                if (auto)
                    return;
                throw error('当前状态无法取消');
            }
            let toStatus = myEnum.payStatus.已取消;
            await detail.update({ status: toStatus });
            detail.status = toStatus;
            await this.contactCancel(detail);
        }
        if (auto)
            return;

        let obj = detail.toJSON();
        let rtn = {
            userId: obj.userId,
            status: obj.status,
            statusText: obj.statusText,
            canCancel: obj.canCancel,
            canPay: obj.canPay,
        };
        PayMapper.resetDetail(rtn, { user });
        return rtn;
    }

    static async contactCancel(pay: PayInstanceType) {
        if (pay.contactType === myEnum.payContactType.商品) {
            let sku = await GoodsSkuModel.findById(pay.contactObj.skuId);
            if (sku) {
                let saleQuantity = sku.saleQuantity - pay.contactObj.quantity;
                await sku.update({ saleQuantity: saleQuantity < 0 ? 0 : saleQuantity });
            }
        }
    }

    static async refundApply(data: ValidSchema.PayRefundApply, opt: { user: LoginUser }) {
        let { user } = opt;
        let pay = await PayMapper.queryOne({ _id: data._id, userId: user._id });
        if (!pay.canRefundApply)
            throw error('当前状态无法申请退款');

        let refund = new RefundModel({
            userId: user._id,
            type: pay.type,
            moneyCent: pay.moneyCent,
            payOrderNo: pay.orderNo
        });
        let payAssetLog = await AssetLogModel.findById(pay.assetLogId);
        let assetLog = new AssetLogModel({
            sourceType: pay.type,
            orderId: refund._id,
            orderNo: refund.orderNo,
            moneyCent: refund.moneyCent,
            type: myEnum.assetType.退款,
            status: myEnum.assetLogStatus.未完成,
            outOrderNo: payAssetLog.outOrderNo,
        });
        let refundStatus = myEnum.payRefundStatus.已申请;
        await transaction(async (session) => {
            await refund.save({ session });
            await assetLog.save({ session });
            await pay.update({ refundStatus }, { session });
        });
        return {
            pay: {
                refundStatus,
                refundStatusText: myEnum.payRefundStatus.getKey(refundStatus),
                canRefundApply: false,
            }
        };
    }

    static async create(data: ValidSchema.PayCreate, opt: {
        user: LoginUser,
        contactType: number,
        contactObj: any
    }) {
        let { user } = opt;
        let pay = new PayModel({
            ...data,
            userId: user._id,
            contactType: opt.contactType,
            contactObj: opt.contactObj
        });
        let { assetLog, payInfo } = await ThirdPartyPayMapper.createPay({
            pay,
        });
        pay.assetLogId = assetLog._id;

        await transaction(async (session) => {
            await pay.save({ session });
            await assetLog.save({ session });
        });
        SendQueue.payAutoCancel({ _id: pay._id });
        return {
            payId: pay._id,
            orderNo: pay.orderNo,
            ...payInfo
        };
    }
}