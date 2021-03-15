import * as Router from '@koa/router';

import { UserAuthMid, MyRequestHandlerMid } from '@/middleware';
import { auth } from '@/config';

let router = new Router();
export default router;


import * as img from './img';
router.get('/my/img/query', UserAuthMid.normal([auth.login]), MyRequestHandlerMid.convert(img.query));
router.post('/my/img/del', UserAuthMid.normal([auth.login]), MyRequestHandlerMid.convert(img.del));