import { dev, env } from '@/config';
import * as common from '@/_system/common';
import { cache } from '@/main';

type WxErrorType = {
    errcode: string;
    errmsg: string;
};

type WxUserInfoType = {
    openid: string;
    nickname: string;
    sex: number;
    language: string;
    city: string;
    province: string;
    country: string;
    headimgurl: string;
    privilege: any[];
};

class WxBase {
    appId: string;
    appSecret: string;
}

export class Wx extends WxBase {

    constructor(opt: WxBase) {
        super();
        this.appId = opt.appId;
        this.appSecret = opt.appSecret;
    }

    getCodeUrl(type) {
        let uri = encodeURIComponent(`${env.host}/wx/auth?type=${type}&getUserInfo=1`);
        let url = 'https://open.weixin.qq.com/connect/oauth2/authorize?'
            + [
                `redirect_uri=${uri}`,
                `appid=${this.appId}`,
                'response_type=code&scope=snsapi_userinfo&state=1&connect_redirect=1#wechat_redirect'
            ].join('&');
        return url;
    }

    async getToken(data: { code }) {
        let url = 'https://api.weixin.qq.com/sns/oauth2/access_token?'
            + [
                `appid=${this.appId}`,
                `secret=${this.appSecret}`,
                `code=${data.code}`,
                'grant_type=authorization_code'
            ].join('&');
        let rs = await common.requestService({ url, method: 'get' });
        let tokenRs = rs.data as WxErrorType;
        if (tokenRs.errcode)
            throw common.error(tokenRs.errmsg);

        //成功
        //{"access_token":"28_xwVEiF34Hu8aZ9jTurGzUkZWPPaUJzWnJnjZgvuh-O3_yoour18olwNMHhD9q8GxmEdJcvrf8GdNvjLPqvOxfrrvuTfVb15egL2Yei0L8ZU","expires_in":7200,"refresh_token":"28_V45NBOAHzJ2gTKifi8fgupmbXUbMVpL-pTCJKGEIqQik37m-TvMH1wM_0DtFxtrNJ4_mlOc4S4ntymyzd1aTzS6-uygzj9eYZrVcjqBAQLg","openid":"o3EBEt4xoZ35nQrec3eiEgJ-16vg","scope":"snsapi_userinfo"}
        return rs.data as {
            access_token: string;
            expires_in: number;
            refresh_token: string;
            openid: string;
            scope: string;
        };
    }

    async getUserInfo(data: { code: string }, opt?: { noReq?: boolean }) {
        opt = { ...opt };
        let cfg = {
            ...dev.cache.wxAuthCode,
            key: data.code,
        };
        let cacheRs = await cache.getByCfg(cfg) as WxUserInfoType;
        if (cacheRs || opt.noReq) {
            if (opt.noReq && !cacheRs)
                throw common.error('已失效,请重新授权');
            return cacheRs;
        }
        let tokenRs = await this.getToken(data);
        let url = `https://api.weixin.qq.com/sns/userinfo?access_token=${tokenRs.access_token}&openid=${tokenRs.openid}`;
        let rs = await common.requestService({ url, method: 'get' });
        let rsData = rs.data as WxErrorType;
        if (rsData.errcode)
            throw common.error(rsData.errmsg);
        //token失效
        //{"errcode":40001,"errmsg":"invalid credential, access_token is invalid or not latest, hints: [ req_id: KhpFn2Dae-jhOqva ]"}
        //{"openid":"o3EBEt4xoZ35nQrec3eiEgJ-16vg","nickname":"nickname","sex":1,"language":"zh_CN","city":"","province":"","country":"CG","headimgurl":"","privilege":[]}
        let succ = rs.data as WxUserInfoType;
        await cache.setByCfg(cfg, succ);
        return succ;
    }
}

export const wxInst = new Wx(env.wxOffiaCcount);