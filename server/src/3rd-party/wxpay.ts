import { wxpay } from '3rd-party-pay';

import * as config from '@/config';

let wxConfig = config.env.wx;
wxpay.WxPayStatic.config({
    sandbox: false, //wxConfig.sandbox,
    requestLog: (log) => {
        // console.log('wx', log);
    }
});

export const wxpayInst = new wxpay.WxPay({
    mch_id: wxConfig.mch_id,
    appid: wxConfig.app.appId,
    key: wxConfig.pay.key,
    pfxPath: wxConfig.pay.certPath,
    payNotifyUrl: wxConfig.payNotifyUrl
});