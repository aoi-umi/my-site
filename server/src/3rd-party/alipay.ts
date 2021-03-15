import { alipay } from '3rd-party-pay';

import * as config from '@/config';

let aliConfig = config.env.ali;
alipay.AliPayStatic.config({
    sandbox: aliConfig.sandbox,
    requestLog: (log) => {
        // console.log('ali', log);
    }
});

export const alipayInst = new alipay.AliPay({
    app_id: aliConfig.appId,
    notify_url: aliConfig.payNotifyUrl,

    rsaPrivatePath: aliConfig.rsaPrivatePath,
    rsaPublicPath: aliConfig.rsaPublicPath,
});