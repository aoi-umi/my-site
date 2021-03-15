import * as Router from '@koa/router';

import { UserAuthMid, MyRequestHandlerMid } from '@/middleware';
import { auth } from '@/config';

let router = new Router();
export default router;

//#region user 
import * as userSign from './user-sign';

router.post('/user/signUp', UserAuthMid.normal(), MyRequestHandlerMid.convert(userSign.signUp));
router.post('/user/signUpCheck', UserAuthMid.normal(), MyRequestHandlerMid.convert(userSign.signUpCheck));
router.post('/user/signIn', UserAuthMid.normal(), MyRequestHandlerMid.convert(userSign.signIn));
router.post('/user/signInByAuth', UserAuthMid.normal(), MyRequestHandlerMid.convert(userSign.signInByAuth));
router.post('/user/signOut', UserAuthMid.normal(), MyRequestHandlerMid.convert(userSign.signOut));
router.post('/user/accountExists', UserAuthMid.normal(), MyRequestHandlerMid.convert(userSign.accountExists));

import * as user from './user';
router.get('/user/info', UserAuthMid.normal([auth.login]), MyRequestHandlerMid.convert(user.info));
router.get('/user/detail', UserAuthMid.normal([auth.login]), MyRequestHandlerMid.convert(user.detail));
router.get('/user/detailQuery', UserAuthMid.normal(), MyRequestHandlerMid.convert(user.detailQuery));
router.post('/user/update', UserAuthMid.normal([auth.login]), MyRequestHandlerMid.convert(user.update));
router.post('/user/unbind', UserAuthMid.normal([auth.login]), MyRequestHandlerMid.convert(user.unbind));
router.post('/user/bind', UserAuthMid.normal([auth.login]), MyRequestHandlerMid.convert(user.bind));
router.get('/user/mgt/query', UserAuthMid.normal([auth.userMgtQuery]), MyRequestHandlerMid.convert(user.mgtQuery));
router.post('/user/mgt/save', UserAuthMid.normal([auth.userMgtEdit]), MyRequestHandlerMid.convert(user.mgtSave));
router.post('/user/mgt/disable', UserAuthMid.normal([auth.userMgtDisable]), MyRequestHandlerMid.convert(user.mgtDisable));
//#endregion

//#region authority 
import * as authority from './authority';
router.get('/authority/query', UserAuthMid.normal([auth.authorityQuery]), MyRequestHandlerMid.convert(authority.query));
router.post('/authority/codeExists', UserAuthMid.normal(), MyRequestHandlerMid.convert(authority.codeExists));
router.post('/authority/save', UserAuthMid.normal([auth.authoritySave]), MyRequestHandlerMid.convert(authority.save));
router.post('/authority/update', UserAuthMid.normal([auth.authoritySave]), MyRequestHandlerMid.convert(authority.update));
router.post('/authority/del', UserAuthMid.normal([auth.authorityDel]), MyRequestHandlerMid.convert(authority.del));
//#endregion

//#region role 
import * as role from './role';
router.get('/role/query', UserAuthMid.normal([auth.roleQuery]), MyRequestHandlerMid.convert(role.query));
router.post('/role/codeExists', UserAuthMid.normal(), MyRequestHandlerMid.convert(role.codeExists));
router.post('/role/save', UserAuthMid.normal([auth.roleSave]), MyRequestHandlerMid.convert(role.save));
router.post('/role/update', UserAuthMid.normal([auth.roleSave]), MyRequestHandlerMid.convert(role.update));
router.post('/role/del', UserAuthMid.normal([auth.roleDel]), MyRequestHandlerMid.convert(role.del));
//#endregion

//#region follow 
import * as follow from './follow';
router.post('/follow/save', UserAuthMid.normal([auth.login]), MyRequestHandlerMid.convert(follow.save));
router.get('/follow/query', UserAuthMid.normal(), MyRequestHandlerMid.convert(follow.query));
//#endregion

//#region chat 
import * as chat from './chat';
router.post('/chat/submit', UserAuthMid.normal([auth.login]), MyRequestHandlerMid.convert(chat.submit));
router.get('/chat/query', UserAuthMid.normal([auth.login]), MyRequestHandlerMid.convert(chat.query));
router.get('/chat/list', UserAuthMid.normal([auth.login]), MyRequestHandlerMid.convert(chat.list));
//#endregion
