import * as wxpay from '3rd-party-pay/dest/lib/wxpay';
import { Types } from 'mongoose';

import { dev, myEnum } from '@/dev-config';
import { logger } from '@/helpers';
import * as common from '@/_system/common';
import { transaction } from '@/_system/dbMongo';
import { PayRefund } from '@/valid-schema/class-valid';
import { cache, mySocket } from '@/main';

import { NotifyModel } from '@/models/mongo/notify';
import {
  AssetLogModel,
  AssetLogInstanceType,
  PayInstanceType,
  PayModel,
  PayMapper,
  RefundModel,
} from '@/models/mongo/asset';
import { UserMapper } from '@/models/mongo/user';
import { OauthModel } from '@/models/mongo/oauth';

import { alipayInst } from './alipay';
import { wxpayInst } from './wxpay';
import { wxInst } from './wx';
import { githubInst } from './github';

export type NotifyType = {
  notifyId: any;
};
export class ThirdPartyPayMapper {
  static async createPay(data: { pay: PayInstanceType }) {
    let pay = data.pay;
    let assetLog = new AssetLogModel({
      sourceType: pay.type,
      orderId: pay._id,
      orderNo: pay.orderNo,
      moneyCent: pay.moneyCent,
      type: myEnum.assetType.支付,
    });
    let payRs: {
      url?: string;
      qrcode?: string;
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
      payInfo: payRs,
    };
  }

  static async refund(data: PayRefund) {
    let pay = await PayMapper.queryOne({ _id: data._id });
    if (!pay.canRefund) throw common.error('当前状态无法退款');
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
      await assetLog.update(
        { status: myEnum.assetLogStatus.已完成 },
        { session },
      );
      await pay.update(
        {
          refundStatus,
          refundMoneyCent: refund.moneyCent + pay.refundMoneyCent,
        },
        { session },
      );
    });
    return {
      pay: {
        refundStatus,
        refundStatusText: myEnum.payRefundStatus.getKey(refundStatus),
        canRefund: false,
      },
    };
  }

  static async notifyHandler(data: NotifyType) {
    let notify = await NotifyModel.findById(data.notifyId);
    let assetLog: AssetLogInstanceType;
    try {
      assetLog = await AssetLogModel.findOne({ orderNo: notify.orderNo });
      if (!assetLog) throw common.error('无对应资金记录');
      if (assetLog.status !== myEnum.assetLogStatus.已完成) {
        if (!assetLog.notifyId) {
          await assetLog.update({
            notifyId: notify._id,
            outOrderNo: notify.outOrderNo,
          });
        } else if (!assetLog.notifyId.equals(notify._id))
          throw common.error('通知id不一致');
        if (notify.type === myEnum.notifyType.支付宝) {
          let rs = await alipayInst.query({
            out_trade_no: assetLog.orderNo,
          });
          if (parseFloat(rs.total_amount as any) !== assetLog.money) {
            throw common.error('金额不一致');
          }
        } else {
          let rs = await wxpayInst.orderQuery({
            out_trade_no: assetLog.orderNo,
          });
          if (parseFloat(rs.total_fee as any) !== assetLog.moneyCent) {
            throw common.error('金额不一致');
          }
        }
        await assetLog.update({ status: myEnum.assetLogStatus.已完成 });
      }
      await PayModel.updateOne(
        {
          assetLogId: assetLog._id,
          status: { $in: [myEnum.payStatus.待处理, myEnum.payStatus.未支付] },
        },
        { status: myEnum.payStatus.已支付 },
      );

      mySocket.payCallBack(notify.orderNo);
    } catch (e) {
      if (assetLog)
        await assetLog.update({
          remark: e.message,
          $push: { remarkList: { msg: e.message, notifyId: notify._id } },
        });
      logger.error('处理通知出错');
      logger.error(e);
      throw e;
    }
  }
}

export class ThirdPartyAuthMapper {
  static async userByHandler(
    data: {
      // TODO: deprecated
      by: string;
      val: string;
      oauthToken?: string;
    },
    opt?: {
      checkIsBind?: boolean;
    },
  ) {
    opt = {
      ...opt,
    };
    let rs: {
      id?: string;
      avatarUrl?: string;
      oauthName?: string;
      // TODO: deprecated
      val?: string;
      saveKey?: string;
      raw?: any;
    };
    if (data.oauthToken) {
      let oauthCacheCfg = {
        ...dev.cache.oauthSignIn,
        key: data.oauthToken,
      };
      let oauthCacheData = await cache.getByCfg(oauthCacheCfg);

      if (oauthCacheData) {
        let oauthData = await OauthModel.findOne({
          name: oauthCacheData.oauthName,
          id: oauthCacheData.id,
        });
        if (oauthData) {
          if (opt.checkIsBind) {
            let oauthNameStr = myEnum.oauthName.getName(
              oauthCacheData.oauthName,
            );
            throw common.error(`${oauthNameStr}已绑定`);
          }
        }
        rs = {
          avatarUrl: oauthCacheData.avatarUrl,
          id: oauthCacheData.id,
          oauthName: oauthCacheData.oauthName,
        };
      }
    } else if (data.by) {
      if (data.by === myEnum.userBy.微信授权) {
        let userRs = await wxInst.getUserInfo(
          { code: data.val },
          { noReq: true },
        );
        rs = {
          val: userRs.openid,
          avatarUrl: userRs.headimgurl,
          raw: userRs,
        };
      }
      let map = {
        [myEnum.userBy.微信授权]: {
          msg: '微信号',
          saveKey: 'wxOpenId',
        },
      }[data.by];
      if (opt.checkIsBind) {
        let exists = await UserMapper.accountExists(rs.val, data.by);
        if (exists) throw common.error(`${map.msg}已绑定`);
      }
      rs.saveKey = map.saveKey;
    } else {
      rs = {
        val: data.val,
      };
    }
    return rs;
  }

  static async oauthUserGet(
    data: { oauthName: string; code: string },
    opt?: {
      checkIsBind?: boolean;
    },
  ) {
    opt = {
      ...opt,
    };
    let resData: {
      oauthName: string;
      id: string;
      nickname: string;
      avatarUrl: string;
      userId?: Types.ObjectId;
    };
    let oauthNameStr = myEnum.oauthName.getName(data.oauthName);
    if (data.oauthName === myEnum.oauthName.github) {
      let rs = await githubInst.getUser(data);
      resData = {
        oauthName: data.oauthName,
        id: rs.id,
        nickname: rs.login,
        avatarUrl: rs.avatar_url,
      };
    } else if (oauthNameStr) {
      throw common.error(`未实现[${oauthNameStr}]`);
    } else {
      throw common.error(`no oauth ${data.oauthName}`);
    }
    let oauthData = await OauthModel.findOne({
      name: resData.oauthName,
      id: resData.id,
    });
    if (oauthData) {
      resData.userId = oauthData.userId;
      if (opt.checkIsBind) throw common.error(`${oauthNameStr}已绑定`);
    }
    return resData;
  }
}
