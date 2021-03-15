import * as wxpay from '3rd-party-pay/dest/lib/wxpay';

import { myEnum } from '@/config';
import { logger } from '@/helpers';
import * as common from '@/_system/common';
import { transaction } from '@/_system/dbMongo';
import { PayRefund } from '@/valid-schema/class-valid';
import { mySocket } from '@/main';

import { NotifyMapper, NotifyInstanceType, NotifyModel } from '@/models/mongo/notify';
import { AssetLogModel, PayInstanceType, AssetLogInstanceType, PayModel, PayMapper } from '@/models/mongo/asset';
import { RefundModel } from '@/models/mongo/asset/refund';
import { UserMapper } from '@/models/mongo/user';

import { alipayInst } from './alipay';
import { wxpayInst } from './wxpay';
import { wxInst } from './wx';

export type NotifyType = {
    notifyId: any,
};
export class ThirdPartyPayMapper {

    static async createPay(data: {
        pay: PayInstanceType
    }) {
        let pay = data.pay;
        let assetLog = new AssetLogModel({
            sourceType: pay.type,
            orderId: pay._id,
            orderNo: pay.orderNo,
            moneyCent: pay.moneyCent,
            type: myEnum.assetType.支付
        });
        let payRs: {
            url?: string,
            qrcode?: string,
        } = {};
        if (assetLog.sourceType === myEnum.assetSourceType.微信) {
            let rs = await wxpayInst.unifiedOrder({
                out_trade_no: assetLog.orderNo,
                total_fee: pay.moneyCent,
                body: pay.content || 'test',
                trade_type: wxpay.TradeType.Native,
                spbill_create_ip: '127.0.0.1',
            });
            assetLog.req = payRs.qrcode = rs.code_url;
        } else if (assetLog.sourceType === myEnum.assetSourceType.支付宝) {
            assetLog.req = payRs.url = alipayInst.pagePay({
                out_trade_no: assetLog.orderNo,
                subject: pay.title || '无标题',
                total_amount: pay.money,
                body: pay.content || '无内容',
                timeout_express: '15m',
            });
        }
        return {
            assetLog,
            payInfo: payRs
        };
    }

    static async refund(data: PayRefund) {
        let pay = await PayMapper.queryOne({ _id: data._id });
        if (!pay.canRefund)
            throw common.error('当前状态无法退款');
        let refund = await RefundModel.findOne({ payOrderNo: pay.orderNo });
        let assetLog = await AssetLogModel.findOne({ orderId: refund._id });

        if (assetLog.sourceType === myEnum.assetSourceType.微信) {
            await wxpayInst.refund({
                out_trade_no: pay.orderNo,
                out_refund_no: refund.orderNo,
                total_fee: pay.moneyCent,
                refund_fee: pay.moneyCent,
            });
        } else if (assetLog.sourceType === myEnum.assetSourceType.支付宝) {
            await alipayInst.refund({
                out_trade_no: pay.orderNo,
                refund_amount: pay.money,
                out_request_no: refund.orderNo,
            });
        }
        let refundStatus = myEnum.payRefundStatus.已退款;
        await transaction(async (session) => {
            await refund.update({ status: refundStatus }, { session });
            await assetLog.update({ status: myEnum.assetLogStatus.已完成 }, { session });
            await pay.update({ refundStatus, refundMoneyCent: refund.moneyCent + pay.refundMoneyCent }, { session });
        });
        return {
            pay: {
                refundStatus,
                refundStatusText: myEnum.payRefundStatus.getKey(refundStatus),
                canRefund: false,
            }
        };
    }

    static async notifyHandler(data: NotifyType) {
        let notify = await NotifyModel.findById(data.notifyId);
        let assetLog: AssetLogInstanceType;
        try {
            assetLog = await AssetLogModel.findOne({ orderNo: notify.orderNo });
            if (!assetLog)
                throw common.error('无对应资金记录');
            if (assetLog.status !== myEnum.assetLogStatus.已完成) {
                if (!assetLog.notifyId) {
                    await assetLog.update({ notifyId: notify._id, outOrderNo: notify.outOrderNo });
                } else if (!assetLog.notifyId.equals(notify._id))
                    throw common.error('通知id不一致');
                if (notify.type === myEnum.notifyType.支付宝) {
                    let rs = await alipayInst.query({
                        out_trade_no: assetLog.orderNo
                    });
                    if (parseFloat(rs.total_amount as any) !== assetLog.money) {
                        throw common.error('金额不一致');
                    }
                } else {
                    let rs = await wxpayInst.orderQuery({
                        out_trade_no: assetLog.orderNo
                    });
                    if (parseFloat(rs.total_fee as any) !== assetLog.moneyCent) {
                        throw common.error('金额不一致');
                    }
                }
                await assetLog.update({ status: myEnum.assetLogStatus.已完成 });
            }
            await PayModel.updateOne({ assetLogId: assetLog._id, status: { $in: [myEnum.payStatus.待处理, myEnum.payStatus.未支付] } }, { status: myEnum.payStatus.已支付 });

            mySocket.payCallBack(notify.orderNo);
        } catch (e) {
            if (assetLog)
                await assetLog.update({ remark: e.message, $push: { remarkList: { msg: e.message, notifyId: notify._id } } });
            logger.error('处理通知出错');
            logger.error(e);
            throw e;
        }
    }
}

export class ThirdPartyAuthMapper {
    static async userByHandler(data: { by: string, val: string }, opt?: { checkExists?: boolean }) {
        opt = {
            ...opt,
        };
        let rs: { val: string, avatarUrl?: string; saveKey?: string; raw?: any };
        if (data.by) {
            if (data.by === myEnum.userBy.微信授权) {
                let userRs = await wxInst.getUserInfo({ code: data.val }, { noReq: true });
                rs = {
                    val: userRs.openid,
                    avatarUrl: userRs.headimgurl,
                    raw: userRs
                };
            }
            let map = {
                [myEnum.userBy.微信授权]: {
                    msg: '微信号',
                    saveKey: 'wxOpenId'
                }
            }[data.by];
            if (opt.checkExists) {
                let exists = await UserMapper.accountExists(rs.val, data.by);
                if (exists)
                    throw common.error(`${map.msg}已绑定`);
            }
            rs.saveKey = map.saveKey;
        } else {
            rs = {
                val: data.val
            };
        }
        return rs;
    }
}