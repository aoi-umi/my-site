import * as Router from '@koa/router';

import { UserAuthMid, MyRequestHandlerMid } from '@/middleware';
import { auth } from '@/config';

let router = new Router();
export default router;


//#region article 
import * as article from './article';
router.get('/article/mgt/query', UserAuthMid.normal([auth.login]), MyRequestHandlerMid.convert(article.mgtQuery));
router.get('/article/mgt/detailQuery', UserAuthMid.normal([auth.login]), MyRequestHandlerMid.convert(article.mgtDetailQuery));
router.post('/article/mgt/save', UserAuthMid.normal([auth.login]), MyRequestHandlerMid.convert(article.mgtSave));
router.post('/article/mgt/del', UserAuthMid.normal(), MyRequestHandlerMid.convert(article.mgtDel));
router.post('/article/mgt/audit', UserAuthMid.normal([auth.articleMgtAudit]), MyRequestHandlerMid.convert(article.mgtAudit));

router.get('/article/query', UserAuthMid.normal(), MyRequestHandlerMid.convert(article.query));
router.get('/article/detailQuery', UserAuthMid.normal(), MyRequestHandlerMid.convert(article.detailQuery));
//#endregion

//#region video 
import * as video from './video';
router.get('/video/mgt/query', UserAuthMid.normal([auth.login]), MyRequestHandlerMid.convert(video.mgtQuery));
router.get('/video/mgt/detailQuery', UserAuthMid.normal([auth.login]), MyRequestHandlerMid.convert(video.mgtDetailQuery));
router.post('/video/mgt/save', UserAuthMid.normal([auth.login]), MyRequestHandlerMid.convert(video.mgtSave));
router.post('/video/mgt/del', UserAuthMid.normal(), MyRequestHandlerMid.convert(video.mgtDel));
router.post('/video/mgt/audit', UserAuthMid.normal([auth.videoMgtAudit]), MyRequestHandlerMid.convert(video.mgtAudit));

router.get('/video/query', UserAuthMid.normal(), MyRequestHandlerMid.convert(video.query));
router.get('/video/detailQuery', UserAuthMid.normal(), MyRequestHandlerMid.convert(video.detailQuery));
//#endregion

//#region comment 
import * as comment from './comment';
router.post('/comment/submit', UserAuthMid.normal([auth.login]), MyRequestHandlerMid.convert(comment.submit));
router.get('/comment/query', UserAuthMid.normal(), MyRequestHandlerMid.convert(comment.query));
router.post('/comment/del', UserAuthMid.normal(), MyRequestHandlerMid.convert(comment.del));
//#endregion

//#region danmaku 
import * as danmaku from './danmaku';
router.post('/danmaku/submit', UserAuthMid.normal([auth.login]), MyRequestHandlerMid.convert(danmaku.submit));
router.get('/danmaku/query', UserAuthMid.normal(), MyRequestHandlerMid.convert(danmaku.query));
//#endregion

//#region vote 
import * as vote from './vote';
router.post('/vote/submit', UserAuthMid.normal([auth.login]), MyRequestHandlerMid.convert(vote.submit));
//#endregion

//#region favourite 
import * as favourite from './favourite';
router.post('/favourite/submit', UserAuthMid.normal([auth.login]), MyRequestHandlerMid.convert(favourite.submit));
router.get('/favourite/query', UserAuthMid.normal([auth.login]), MyRequestHandlerMid.convert(favourite.query));
//#endregion

//#region view-history 
import * as viewHistory from './view-history';
router.get('/view-history/query', UserAuthMid.normal([auth.login]), MyRequestHandlerMid.convert(viewHistory.query));
//#endregion
