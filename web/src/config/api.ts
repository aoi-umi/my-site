import { TestApiConfigType } from '../api'
import { currEnvCfg } from './env'

export default {
  test: {
    defaultArgs: {
      host: `${currEnvCfg.apiHost}/devMgt`
    },
    method: {
      serverInfo: {
        url: '/server/info',
        method: 'get'
      },
      userSignUp: {
        url: '/user/signUp'
      },
      userSignUpCheck: {
        url: '/user/signUpCheck'
      },
      userSignIn: {
        url: '/user/signIn'
      },
      userSignInByAuth: {
        url: '/user/signInByAuth'
      },
      userSignOut: {
        url: '/user/signOut'
      },
      userInfo: {
        url: '/user/info',
        method: 'get'
      },
      userDetail: {
        url: '/user/detail',
        method: 'get'
      },
      userDetailQuery: {
        url: '/user/detailQuery',
        method: 'get'
      },
      userUpdate: {
        url: '/user/update'
      },
      userUnbind: {
        url: '/user/unbind'
      },
      userBind: {
        url: '/user/bind'
      },
      userAccountExists: {
        url: '/user/accountExists'
      },

      userMgtQuery: {
        url: '/user/mgt/query',
        method: 'get'
      },
      userMgtSave: {
        url: '/user/mgt/save'
      },
      userMgtDisable: {
        url: '/user/mgt/disable'
      },

      bookmarkQuery: {
        url: '/bookmark/query',
        method: 'GET'
      },
      bookmarkSave: {
        url: '/bookmark/save'
      },
      bookmarkDel: {
        url: '/bookmark/del'
      },

      authorityQuery: {
        url: '/authority/query',
        method: 'GET'
      },
      authorityCodeExists: {
        url: '/authority/codeExists'
      },
      authoritySave: {
        url: '/authority/save'
      },
      authorityUpdate: {
        url: '/authority/update'
      },
      authorityDel: {
        url: '/authority/del'
      },

      roleQuery: {
        url: '/role/query',
        method: 'GET'
      },
      roleCodeExists: {
        url: '/role/codeExists'
      },
      roleSave: {
        url: '/role/save'
      },
      roleUpdate: {
        url: '/role/update'
      },
      roleDel: {
        url: '/role/del'
      },

      articleQuery: {
        url: '/article/query',
        method: 'GET'
      },
      articleDetailQuery: {
        url: '/article/detailQuery',
        method: 'GET'
      },
      articleMgtQuery: {
        url: '/article/mgt/query',
        method: 'GET'
      },
      articleMgtDetailQuery: {
        url: '/article/mgt/detailQuery',
        method: 'GET'
      },
      articleMgtSave: {
        url: '/article/mgt/save'
      },
      articleMgtDel: {
        url: '/article/mgt/del'
      },
      articleMgtAudit: {
        url: '/article/mgt/audit'
      },

      videoQuery: {
        url: '/video/query',
        method: 'GET'
      },
      videoDetailQuery: {
        url: '/video/detailQuery',
        method: 'GET'
      },
      videoMgtQuery: {
        url: '/video/mgt/query',
        method: 'GET'
      },
      videoMgtDetailQuery: {
        url: '/video/mgt/detailQuery',
        method: 'GET'
      },
      videoMgtSave: {
        url: '/video/mgt/save'
      },
      videoMgtDel: {
        url: '/video/mgt/del'
      },
      videoMgtAudit: {
        url: '/video/mgt/audit'
      },

      danmakuSubmit: {
        url: '/danmaku/submit'
      },
      danmakuQuery: {
        url: '/danmaku/query',
        method: 'GET'
      },

      commentQuery: {
        url: '/comment/query',
        method: 'GET'
      },
      commentSubmit: {
        url: '/comment/submit'
      },
      commentDel: {
        url: '/comment/del'
      },

      voteSubmit: {
        url: '/vote/submit'
      },
      favouriteSubmit: {
        url: '/favourite/submit'
      },
      favouriteQuery: {
        url: '/favourite/query',
        method: 'get'
      },
      viewHistoryQuery: {
        url: '/view-history/query',
        method: 'get'
      },
      myImgQuery: {
        url: '/my/img/query',
        method: 'get'
      },
      myImgDel: {
        url: '/my/img/del'
      },
      followSave: {
        url: '/follow/save'
      },
      followQuery: {
        url: '/follow/query',
        method: 'get'
      },
      chatSubmit: {
        url: '/chat/submit'
      },
      chatQuery: {
        url: '/chat/query',
        method: 'get'
      },
      chatList: {
        url: '/chat/list',
        method: 'get'
      },
      payCreate: {
        url: '/pay/create'
      },
      paySubmit: {
        url: '/pay/submit'
      },
      payCancel: {
        url: '/pay/cancel'
      },
      payQuery: {
        url: '/pay/query',
        method: 'get'
      },
      payRefundApply: {
        url: '/pay/refundApply'
      },
      payRefund: {
        url: '/pay/refund'
      },

      assetLogQuery: {
        url: '/asset/logQuery',
        method: 'get'
      },
      assetNotifyQuery: {
        url: '/asset/notifyQuery',
        method: 'get'
      },
      assetNotifyRetry: {
        url: '/asset/notifyRetry'
      },

      goodsMgtQuery: {
        url: '/goods/mgt/query',
        method: 'get'
      },
      goodsMgtDetailQuery: {
        url: '/goods/mgt/detailQuery',
        method: 'get'
      },
      goodsMgtSave: {
        url: '/goods/mgt/save'
      },
      goodsMgtDel: {
        url: '/goods/mgt/del'
      },
      goodsQuery: {
        url: '/goods/query',
        method: 'get'
      },
      goodsDetailQuery: {
        url: '/goods/detailQuery',
        method: 'get'
      },
      goodsBuy: {
        url: '/goods/buy'
      },

      settingDetailQuery: {
        url: '/setting/mgt/detailQuery',
        method: 'get'
      },
      settingSave: {
        url: '/setting/mgt/save'
      },

      // file
      imgUpload: {
        url: '/img/upload'
      },
      imgGet: {
        url: '/img'
      },
      videoUpload: {
        url: '/video/upload'
      },
      videoGet: {
        url: '/video'
      },

      wxGetCode: {
        url: '/wx/getCode',
        method: 'get'
      },
      wxGetUserInfo: {
        url: '/wx/getUserInfo',
        method: 'get'
      },
      wxCodeSend: {
        url: '/wx/codeSend'
      },
      statPVSave: {
        url: '/stat/pv/save'
      },
      statQuery: {
        url: '/stat/query',
        method: 'get'
      },
      printMgtQuery: {
        url: '/print/mgt/query',
        method: 'get'
      },
      printMgtDetailQuery: {
        url: '/print/mgt/detailQuery',
        method: 'get'
      },
      printMgtSave: {
        url: '/print/mgt/save'
      },
      printMgtDel: {
        url: '/print/mgt/del'
      },
      printGetData: {
        url: '/print/getData',
        method: 'get'
      }
    }
  } as TestApiConfigType
}
