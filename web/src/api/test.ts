import { LocalStore } from '@/store'

import { error } from '../helpers/utils'
import { dev } from '../config'

import { ApiModel, ApiConfigModel, ApiMethodConfigType } from './model'
import { ApiListQueryArgs, ApiMethod } from '.'

type TestApiMethod = ApiMethod<ApiMethodConfigType, {
  serverInfo,
  userSignUp,
  userSignUpCheck,
  userSignIn,
  userSignInByAuth,
  userSignOut,
  userInfo,
  userAccountExists,
  userDetail,
  userDetailQuery,
  userUpdate,
  userUnbind,
  userBind,

  userMgtQuery,
  userMgtSave,
  userMgtDisable,

  bookmarkQuery,
  bookmarkSave,
  bookmarkDel,

  authorityQuery,
  authorityCodeExists,
  authoritySave,
  authorityUpdate,
  authorityDel,

  roleQuery,
  roleCodeExists,
  roleSave,
  roleUpdate,
  roleDel,

  articleQuery,
  articleDetailQuery,
  articleMgtQuery,
  articleMgtDetailQuery,
  articleMgtSave,
  articleMgtDel,
  articleMgtAudit,

  videoQuery,
  videoDetailQuery,
  videoMgtQuery,
  videoMgtDetailQuery,
  videoMgtSave,
  videoMgtDel,
  videoMgtAudit,

  danmakuSubmit,
  danmakuQuery,

  commentSubmit,
  commentQuery,
  commentDel,

  voteSubmit,
  favouriteSubmit,
  favouriteQuery,

  viewHistoryQuery,

  myImgQuery,
  myImgDel,
  followSave,
  followQuery,
  chatSubmit,
  chatQuery,
  chatList,
  payCreate,
  paySubmit,
  payCancel,
  payQuery,
  payRefundApply,
  payRefund,

  assetLogQuery,
  assetNotifyQuery,
  assetNotifyRetry,

  goodsMgtQuery,
  goodsMgtDetailQuery,
  goodsMgtSave,
  goodsMgtDel,
  goodsQuery,
  goodsDetailQuery,
  goodsBuy,

  // file
  imgUpload,
  imgGet,
  videoUpload,
  videoGet,

  settingDetailQuery,
  settingSave,

  wxGetCode,
  wxGetUserInfo,
  wxCodeSend,

  statPVSave,
  statQuery,

  printMgtQuery,
  printMgtSave,
  printMgtDetailQuery,
  printMgtDel,

  printGetData,
}>;
export type TestApiConfigType = ApiConfigModel<TestApiMethod>;

export type Result<T = any> = {
  result: boolean;
  msg?: string;
  code?: string;
  data: T;
};

export type ListResult<T = any> = {
  total: number;
  rows: T[];
};
export class TestApi extends ApiModel<TestApiMethod> {
  constructor (apiConfig: TestApiConfigType) {
    super(apiConfig, {
      beforeRequest: (req) => {
        req.headers = {
          ...this.defaultHeaders(),
          ...req.headers
        }
        req.withCredentials = true
        return req
      },
      afterResponse: (res: Result) => {
        if (!res.result) { throw error(res.msg, res.code) }
        return res.data
      }
    })
    this.imgUploadUrl = this.getRequestConfig(this.apiConfig.method.imgUpload).url
    this.imgUrl = this.getRequestConfig(this.apiConfig.method.imgGet).url
    this.videoUploadUrl = this.getRequestConfig(this.apiConfig.method.videoUpload).url
    this.videoUrl = this.getRequestConfig(this.apiConfig.method.videoGet).url
  }

  defaultHeaders () {
    const headers = {}
    const token = LocalStore.getItem(dev.cacheKey.testUser)
    if (token) { headers[dev.cacheKey.testUser] = token }
    return headers
  }
  // #region file
  imgUploadUrl = '';
  videoUploadUrl = '';
  uplodaHandler (res: Result) {
    return this.afterResponse(res) as FileUploadRes
  }

  async imgUpload (file) {
    const formData = new FormData()
    formData.append('file', file)
    return this.requestByConfig<FileUploadRes>(this.apiConfig.method.imgUpload, {
      data: formData
    })
  }

  imgUrl = '';
  getImgUrl (id) {
    return id ? this.imgUrl + '?_id=' + id : ''
  }

  videoUrl = '';
  getVideoUrl (id) {
    return id ? this.videoUrl + '?_id=' + id : ''
  }
  // #endregion

  async serverInfo () {
    return this.requestByConfig(this.apiConfig.method.serverInfo)
  }

  // #region user
  async userSignUp (data: { account: string, nickname: string, password: string }) {
    return this.requestByConfig(this.apiConfig.method.userSignUp, { data })
  }
  async userSignUpCheck () {
    return this.requestByConfig(this.apiConfig.method.userSignUpCheck)
  }
  async userSignIn (data) {
    return this.requestByConfig(this.apiConfig.method.userSignIn, { data })
  }
  async userSignInByAuth (data) {
    return this.requestByConfig(this.apiConfig.method.userSignInByAuth, { data })
  }
  async userSignOut () {
    return this.requestByConfig(this.apiConfig.method.userSignOut)
  }
  // 登录信息
  async userInfo () {
    return this.requestByConfig(this.apiConfig.method.userInfo)
  }
  // 用户详细（自己）
  async userDetail () {
    return this.requestByConfig(this.apiConfig.method.userDetail)
  }
  async userDetailQuery (_id) {
    return this.requestByConfig(this.apiConfig.method.userDetailQuery, { data: { _id }})
  }
  async userUpdate (data) {
    return this.requestByConfig(this.apiConfig.method.userUpdate, { data })
  }
  async userUnbind (data) {
    return this.requestByConfig(this.apiConfig.method.userUnbind, { data })
  }
  async userBind (data) {
    return this.requestByConfig(this.apiConfig.method.userBind, { data })
  }
  async userAccountExists (data) {
    return this.requestByConfig(this.apiConfig.method.userAccountExists, { data })
  }

  async userMgtQuery (data?) {
    return this.requestByConfig(this.apiConfig.method.userMgtQuery, { data })
  }
  async userMgtSave (data) {
    return this.requestByConfig(this.apiConfig.method.userMgtSave, { data })
  }
  async userMgtDisable (data) {
    return this.requestByConfig(this.apiConfig.method.userMgtDisable, { data })
  }
  // #endregion

  // #region bookmark
  async bookmarkQuery (data?: { name?, url?, anyKey?} & ApiListQueryArgs) {
    return this.requestByConfig<ListResult>(this.apiConfig.method.bookmarkQuery, { data })
  }
  async bookmarkSave (data) {
    return this.requestByConfig(this.apiConfig.method.bookmarkSave, { data })
  }
  async bookmarkDel (data) {
    return this.requestByConfig(this.apiConfig.method.bookmarkDel, { data })
  }
  // #endregion

  // #region authority
  async authorityQuery (data?: { name?, code?, status?, anyKey?, getAll?: boolean } & ApiListQueryArgs) {
    return this.requestByConfig<ListResult>(this.apiConfig.method.authorityQuery, { data })
  }
  async authoritySave (data) {
    return this.requestByConfig(this.apiConfig.method.authoritySave, { data })
  }
  async authorityCodeExists (data) {
    return this.requestByConfig(this.apiConfig.method.authorityCodeExists, { data })
  }
  async authorityUpdate (data) {
    return this.requestByConfig(this.apiConfig.method.authorityUpdate, { data })
  }
  async authorityDel (idList: string[]) {
    return this.requestByConfig(this.apiConfig.method.authorityDel, { data: { idList }})
  }
  // #endregion

  // #region role
  async roleQuery (data?: { name?, code?, status?, anyKey?, getAll?: boolean } & ApiListQueryArgs) {
    return this.requestByConfig<ListResult>(this.apiConfig.method.roleQuery, { data })
  }
  async roleSave (data) {
    return this.requestByConfig(this.apiConfig.method.roleSave, { data })
  }
  async roleCodeExists (data) {
    return this.requestByConfig(this.apiConfig.method.roleCodeExists, { data })
  }
  async roleUpdate (data) {
    return this.requestByConfig(this.apiConfig.method.roleUpdate, { data })
  }
  async roleDel (idList: string[]) {
    return this.requestByConfig(this.apiConfig.method.roleDel, { data: { idList }})
  }
  // #endregion

  // #region article
  async articleQuery (data?: { anyKey?} & ApiListQueryArgs) {
    return this.requestByConfig<ListResult>(this.apiConfig.method.articleQuery, { data })
  }
  async articleDetailQuery (data) {
    return this.requestByConfig(this.apiConfig.method.articleDetailQuery, { data })
  }
  async articleMgtQuery (data?: { anyKey?} & ApiListQueryArgs) {
    return this.requestByConfig<ListResult>(this.apiConfig.method.articleMgtQuery, { data })
  }
  async articleMgtDetailQuery (data) {
    return this.requestByConfig(this.apiConfig.method.articleMgtDetailQuery, { data })
  }
  async articleMgtSave (data) {
    return this.requestByConfig(this.apiConfig.method.articleMgtSave, { data })
  }
  async articleMgtDel (data: { idList: string[], remark?: string }) {
    return this.requestByConfig(this.apiConfig.method.articleMgtDel, { data })
  }
  async articleMgtAudit (data: { idList: string[], status, remark?}) {
    return this.requestByConfig(this.apiConfig.method.articleMgtAudit, { data })
  }
  // #endregion

  // #region video
  async videoQuery (data?: { anyKey?} & ApiListQueryArgs) {
    return this.requestByConfig<ListResult>(this.apiConfig.method.videoQuery, { data })
  }
  async videoDetailQuery (data) {
    return this.requestByConfig(this.apiConfig.method.videoDetailQuery, { data })
  }
  async videoMgtQuery (data?: { anyKey?} & ApiListQueryArgs) {
    return this.requestByConfig<ListResult>(this.apiConfig.method.videoMgtQuery, { data })
  }
  async videoMgtDetailQuery (data) {
    return this.requestByConfig(this.apiConfig.method.videoMgtDetailQuery, { data })
  }
  async videoMgtSave (data) {
    return this.requestByConfig(this.apiConfig.method.videoMgtSave, { data })
  }
  async videoMgtDel (data: { idList: string[], remark?: string }) {
    return this.requestByConfig(this.apiConfig.method.videoMgtDel, { data })
  }
  async videoMgtAudit (data: { idList: string[], status, remark?}) {
    return this.requestByConfig(this.apiConfig.method.videoMgtAudit, { data })
  }
  // #endregion

  // #region danmaku

  async danmakuSubmit (data) {
    return this.requestByConfig(this.apiConfig.method.danmakuSubmit, { data })
  }
  async danmakuQuery (data) {
    return this.requestByConfig<ListResult>(this.apiConfig.method.danmakuQuery, { data })
  }
  // #endregion

  // #region comment

  async commentSubmit (data) {
    return this.requestByConfig(this.apiConfig.method.commentSubmit, { data })
  }
  async commentQuery (data) {
    const rs = await this.requestByConfig<ListResult>(this.apiConfig.method.commentQuery, { data })
    return rs
  }
  async commentDel (data) {
    return this.requestByConfig(this.apiConfig.method.commentDel, { data })
  }
  // #endregion

  // #region vote
  async voteSubmit (data) {
    return this.requestByConfig(this.apiConfig.method.voteSubmit, { data })
  }
  // #endregion

  // #region favourite
  async favouriteSubmit (data) {
    return this.requestByConfig(this.apiConfig.method.favouriteSubmit, { data })
  }
  async favouriteQuery (data) {
    return this.requestByConfig(this.apiConfig.method.favouriteQuery, { data })
  }
  // #endregion

  // #region view-history
  async viewHistoryQuery (data) {
    return this.requestByConfig(this.apiConfig.method.viewHistoryQuery, { data })
  }
  // #endregion

  // #region my
  async myImgQuery (data) {
    return this.requestByConfig(this.apiConfig.method.myImgQuery, { data })
  }
  async myImgDel (data) {
    return this.requestByConfig(this.apiConfig.method.myImgDel, { data })
  }
  // #endregion

  // #region follow
  async followSave (data) {
    return this.requestByConfig(this.apiConfig.method.followSave, { data })
  }
  async followQuery (data) {
    return this.requestByConfig(this.apiConfig.method.followQuery, { data })
  }
  // #endregion

  // #region chat
  async chatSubmit (data) {
    return this.requestByConfig(this.apiConfig.method.chatSubmit, { data })
  }
  async chatQuery (data) {
    return this.requestByConfig<ListResult>(this.apiConfig.method.chatQuery, { data })
  }
  async chatList (data) {
    return this.requestByConfig<ListResult>(this.apiConfig.method.chatList, { data })
  }
  // #endregion

  // #region pay
  async payCreate (data) {
    return this.requestByConfig(this.apiConfig.method.payCreate, { data })
  }
  async paySubmit (data) {
    return this.requestByConfig(this.apiConfig.method.paySubmit, { data })
  }
  async payCancel (data) {
    return this.requestByConfig(this.apiConfig.method.payCancel, { data })
  }
  async payQuery (data) {
    return this.requestByConfig<ListResult>(this.apiConfig.method.payQuery, { data })
  }
  async payRefundApply (data) {
    return this.requestByConfig(this.apiConfig.method.payRefundApply, { data })
  }
  async payRefund (data) {
    return this.requestByConfig(this.apiConfig.method.payRefund, { data })
  }

  async assetLogQuery (data) {
    return this.requestByConfig<ListResult>(this.apiConfig.method.assetLogQuery, { data })
  }
  async assetNotifyQuery (data) {
    return this.requestByConfig<ListResult>(this.apiConfig.method.assetNotifyQuery, { data })
  }
  async assetNotifyRetry (data) {
    return this.requestByConfig<ListResult>(this.apiConfig.method.assetNotifyRetry, { data })
  }
  // #endregion

  // #region goods

  async goodsMgtQuery (data) {
    return this.requestByConfig(this.apiConfig.method.goodsMgtQuery, { data })
  }
  async goodsMgtDetailQuery (data) {
    return this.requestByConfig(this.apiConfig.method.goodsMgtDetailQuery, { data })
  }
  async goodsMgtSave (data) {
    return this.requestByConfig(this.apiConfig.method.goodsMgtSave, { data })
  }
  async goodsMgtDel (data) {
    return this.requestByConfig(this.apiConfig.method.goodsMgtDel, { data })
  }

  async goodsQuery (data) {
    return this.requestByConfig(this.apiConfig.method.goodsQuery, { data })
  }
  async goodsDetailQuery (data) {
    return this.requestByConfig(this.apiConfig.method.goodsDetailQuery, { data })
  }
  async goodsBuy (data) {
    return this.requestByConfig(this.apiConfig.method.goodsBuy, { data })
  }
  // #endregion

  // #region setting

  async settingDetailQuery (data?) {
    return this.requestByConfig(this.apiConfig.method.settingDetailQuery, { data })
  }
  async settingSave (data) {
    return this.requestByConfig(this.apiConfig.method.settingSave, { data })
  }
  // #endregion

  // #region wx

  async wxGetCode (data) {
    return this.requestByConfig(this.apiConfig.method.wxGetCode, { data })
  }
  async wxGetUserInfo (data) {
    return this.requestByConfig(this.apiConfig.method.wxGetUserInfo, { data })
  }
  async wxCodeSend (data) {
    return this.requestByConfig(this.apiConfig.method.wxCodeSend, { data })
  }
  // #endregion

  // #region stat
  async statPVSave (data) {
    return this.requestByConfig(this.apiConfig.method.statPVSave, { data })
  }
  async statQuery () {
    return this.requestByConfig(this.apiConfig.method.statQuery)
  }
  // #endregion

  // #region print
  async printMgtQuery (data) {
    return this.requestByConfig(this.apiConfig.method.printMgtQuery, { data })
  }

  async printMgtDetailQuery (data) {
    return this.requestByConfig(this.apiConfig.method.printMgtDetailQuery, { data })
  }

  async printMgtSave (data) {
    return this.requestByConfig(this.apiConfig.method.printMgtSave, { data })
  }

  async printMgtDel (data) {
    return this.requestByConfig(this.apiConfig.method.printMgtDel, { data })
  }

  async printGetData (data) {
    return this.requestByConfig(this.apiConfig.method.printGetData, { data })
  }

  // #endregion
}

type FileUploadRes = { fileId: string; url: string };
