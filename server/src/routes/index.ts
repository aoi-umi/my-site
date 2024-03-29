import * as Router from '@koa/router';
import {
  UserAuthMid,
  FileMid,
  MyRequestHandlerMid,
  UserStatMid,
} from '@/middleware';
import { auth, env } from '@/dev-config';

let router = new Router({
  prefix: env.urlPrefix,
});
export default router;

router.get(
  '/server/info',
  UserStatMid.stat,
  MyRequestHandlerMid.convert(() => {
    return {
      name: env.name,
      version: env.version,
    };
  }),
);

import user from './user';
import content from './content';
import my from './my';

[user, content, my].forEach((ele) => {
  router.use(ele.routes());
});

//#region bookmark
import * as bookmark from './bookmark';
router.get(
  '/bookmark/query',
  UserAuthMid.normal(),
  MyRequestHandlerMid.convert(bookmark.query),
);
router.post(
  '/bookmark/save',
  UserAuthMid.normal(),
  MyRequestHandlerMid.convert(bookmark.save),
);
router.post(
  '/bookmark/del',
  UserAuthMid.normal(),
  MyRequestHandlerMid.convert(bookmark.del),
);
//#endregion

//#region pay
import * as pay from './pay/pay';
router.post(
  '/pay/submit',
  UserAuthMid.normal([auth.login]),
  MyRequestHandlerMid.convert(pay.submit),
);
router.post(
  '/pay/cancel',
  UserAuthMid.normal([auth.login]),
  MyRequestHandlerMid.convert(pay.cancel),
);
router.get(
  '/pay/query',
  UserAuthMid.normal([auth.login]),
  MyRequestHandlerMid.convert(pay.query),
);
router.post(
  '/pay/refundApply',
  UserAuthMid.normal([auth.login]),
  MyRequestHandlerMid.convert(pay.refundApply),
);
router.post(
  '/pay/refund',
  UserAuthMid.normal([auth.payMgtOperate]),
  MyRequestHandlerMid.convert(pay.refund),
);
//#endregion

//#region notify
import * as notify from './pay/notify';
router.post('/alipay/notify', notify.alipayNotify);
router.post('/wxpay/notify', notify.wxpayNotify);
//#endregion

//#region asset
import * as asset from './pay/asset';
router.get(
  '/asset/notifyQuery',
  UserAuthMid.normal([auth.payMgtQuery]),
  MyRequestHandlerMid.convert(asset.notifyQuery),
);
router.post(
  '/asset/notifyRetry',
  UserAuthMid.normal([auth.payMgtOperate]),
  MyRequestHandlerMid.convert(asset.notifyRetry),
);
router.get(
  '/asset/logQuery',
  UserAuthMid.normal([auth.payMgtQuery]),
  MyRequestHandlerMid.convert(asset.logQuery),
);
//#endregion

//#region file
import * as file from './file';
router.get(
  '/file/mgt/query',
  UserAuthMid.normal([auth.fileMgtQuery]),
  MyRequestHandlerMid.convert(file.mgtQuery),
);
router.get(
  '/file/mgt/get',
  UserAuthMid.normal([auth.fileMgtQuery]),
  MyRequestHandlerMid.convert(file.mgtDownload),
);
router.post(
  '/file/mgt/del',
  UserAuthMid.normal([auth.fileMgtDel]),
  MyRequestHandlerMid.convert(file.mgtDel),
);
router.post(
  '/file/mgt/recovery',
  UserAuthMid.normal([auth.fileMgtRecovery]),
  MyRequestHandlerMid.convert(file.mgtRecovery),
);

router.post(
  '/file/uploadCheck',
  UserAuthMid.normal([]),
  MyRequestHandlerMid.convert(file.uploadCheck),
);
router.post(
  '/file/uploadByChunks',
  UserAuthMid.normal([auth.login]),
  FileMid.single,
  MyRequestHandlerMid.convert(file.uploadByChunks),
);

router.post(
  '/img/upload',
  UserAuthMid.normal([auth.login]),
  FileMid.single,
  MyRequestHandlerMid.convert(file.imgUpload),
);
router.get(
  '/img',
  UserAuthMid.normal(),
  MyRequestHandlerMid.convert(file.imgGet),
);

router.post(
  '/video/upload',
  UserAuthMid.normal([auth.login]),
  FileMid.single,
  MyRequestHandlerMid.convert(file.videoUpload),
);
router.get('/video', MyRequestHandlerMid.convert(file.vedioGet));
//#endregion

//#region goods
import * as goods from './goods';
router.post(
  '/goods/mgt/save',
  UserAuthMid.normal([auth.login]),
  MyRequestHandlerMid.convert(goods.mgtSave),
);
router.get(
  '/goods/mgt/detailQuery',
  UserAuthMid.normal([auth.login]),
  MyRequestHandlerMid.convert(goods.mgtDetailQuery),
);
router.get(
  '/goods/mgt/query',
  UserAuthMid.normal([auth.login]),
  MyRequestHandlerMid.convert(goods.mgtQuery),
);
router.post(
  '/goods/mgt/del',
  UserAuthMid.normal([auth.login]),
  MyRequestHandlerMid.convert(goods.mgtDel),
);

router.get(
  '/goods/detailQuery',
  UserAuthMid.normal(),
  MyRequestHandlerMid.convert(goods.detailQuery),
);
router.get(
  '/goods/query',
  UserAuthMid.normal(),
  MyRequestHandlerMid.convert(goods.query),
);
router.post(
  '/goods/buy',
  UserAuthMid.normal(),
  MyRequestHandlerMid.convert(goods.buy),
);
//#endregion

//#region setting
import * as setting from './setting';
router.get(
  '/setting/mgt/detailQuery',
  UserAuthMid.normal([auth.settingQuery]),
  MyRequestHandlerMid.convert(setting.detailQuery),
);
router.post(
  '/setting/mgt/save',
  UserAuthMid.normal([auth.settingSave]),
  MyRequestHandlerMid.convert(setting.save),
);
//#endregion

//#region wx
import * as wx from './wx';
router.get('/wx/getCode', MyRequestHandlerMid.convert(wx.getCode));
router.get('/wx/getUserInfo', MyRequestHandlerMid.convert(wx.getUserInfo));
router.post('/wx/codeSend', MyRequestHandlerMid.convert(wx.codeSend));
//#endregion

//#region stat
import * as stat from './stat';
router.post('/stat/pv/save', MyRequestHandlerMid.convert(stat.pvSave));
router.get('/stat/query', MyRequestHandlerMid.convert(stat.query));
//#endregion

//#region print
import * as printTemp from './print-temp';
router.get(
  '/print/mgt/query',
  UserAuthMid.normal(),
  MyRequestHandlerMid.convert(printTemp.mgtQuery),
);
router.get(
  '/print/mgt/detailQuery',
  UserAuthMid.normal(),
  MyRequestHandlerMid.convert(printTemp.mgtDetailQuery),
);
router.post(
  '/print/mgt/save',
  UserAuthMid.normal(),
  MyRequestHandlerMid.convert(printTemp.mgtSave),
);
router.post(
  '/print/mgt/del',
  UserAuthMid.normal(),
  MyRequestHandlerMid.convert(printTemp.mgtDel),
);
router.get(
  '/print/mgt/export',
  UserAuthMid.normal(),
  MyRequestHandlerMid.convert(printTemp.mgtExport),
);

import * as print from './print';
router.get(
  '/print/getData',
  UserAuthMid.normal(),
  MyRequestHandlerMid.convert(print.getData),
);
//#endregion

//#region dynamic sql
import * as dynamicSql from './dynamic-sql';
router.post(
  '/dynamicSql/exec',
  UserAuthMid.normal(),
  MyRequestHandlerMid.convert(dynamicSql.exec),
);
//#endregion

//#region comp
import * as comp from './comp';
router.get(
  '/comp/mgt/query',
  UserAuthMid.normal(),
  MyRequestHandlerMid.convert(comp.mgtQuery),
);
router.get(
  '/comp/mgt/detailQuery',
  UserAuthMid.normal(),
  MyRequestHandlerMid.convert(comp.mgtDetailQuery),
);
router.post(
  '/comp/mgt/save',
  UserAuthMid.normal(),
  MyRequestHandlerMid.convert(comp.mgtSave),
);
router.post(
  '/comp/mgt/moduleSave',
  UserAuthMid.normal(),
  MyRequestHandlerMid.convert(comp.mgtModuleSave),
);
router.post(
  '/comp/mgt/configSave',
  UserAuthMid.normal(),
  MyRequestHandlerMid.convert(comp.mgtConfigSave),
);
router.get(
  '/comp/mgt/configQuery',
  UserAuthMid.normal(),
  MyRequestHandlerMid.convert(comp.mgtConfigQuery),
);
router.post(
  '/comp/mgt/del',
  UserAuthMid.normal(),
  MyRequestHandlerMid.convert(comp.mgtDel),
);

router.get(
  '/comp/detailQuery',
  UserAuthMid.normal(),
  MyRequestHandlerMid.convert(comp.detailQuery),
);
//#endregion

//#region live
import * as live from './live';
router.get(
  '/live/info',
  UserAuthMid.normal([auth.login]),
  MyRequestHandlerMid.convert(live.info),
);
//#endregion
