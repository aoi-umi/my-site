import { LocalStore } from '@/store'

import { error } from '../helpers/utils'
import { dev } from '../config'

import { ApiModel, ApiConfigModel, ApiMethodConfigType, ApiMethod, ApiMethodInferType } from './model'
import { ApiListQueryArgs } from '.'

export type TestMethod = {
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

  bookmarkQuery: ApiMethodInferType<any, ListResult>,
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
  fileUploadByChunks,
  fileUploadCheck,
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
  dynamicSqlExec,

  compMgtQuery,
  compMgtSave,
  compMgtModuleSave,
  compMgtConfigSave,
  compMgtConfigQuery,
  compMgtDetailQuery,
  compMgtDel,
  compDetailQuery,

  liveInfo
}
export type TestApiConfigType = ApiConfigModel<TestMethod>;

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
export class TestApi extends ApiModel<TestMethod> {
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
    this.fileUploadByChunksUrl = this.getRequestConfig(this.apiConfig.method.fileUploadByChunks).url
    this.fileUploadCheckUrl = this.getRequestConfig(this.apiConfig.method.fileUploadCheck).url
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
  fileUploadByChunksUrl = ''
  fileUploadCheckUrl = ''
  imgUploadUrl = '';
  videoUploadUrl = '';
  uplodaHandler (res: Result) {
    return this.afterResponse(res) as FileUploadRes
  }
  resHandler (res: Result) {
    return this.afterResponse(res)
  }

  uploader (file, url, opt?) {
    const formData = new FormData()
    formData.append('file', file)
    let obj = {
      result: null as Promise<FileUploadRes>,
      progress: 0
    }
    let result = this.requestByConfig<FileUploadRes>(url, {
      data: formData,
      onUploadProgress: (progress) => {
        obj.progress = Math.round(
          progress.loaded / progress.total * 100
        )
      }
    })
    obj.result = result
    return obj
  }

  imgUpload (file) {
    return this.uploader(file, this.apiConfig.method.imgUpload)
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
}

type FileUploadRes = { fileId: string; url: string };
