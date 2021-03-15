import { authority, error, dev } from '../config'
import cfgAdmin from './cfg-admin'
import cfgApps from './cfg-apps'
import cfgTest from './cfg-test'

const errPath = '/error'

const cfg = {
  index: {
    path: '/',
    text: 'Home'
  },
  bookmark: {
    path: '/bookmark',
    text: '书签',
    component: () => import('../views/bookmark')
  },
  userInfo: {
    path: '/user/info',
    text: '个人主页',
    component: () => import('../views/user/user')
  },
  userChat: {
    path: '/user/chat',
    text: '私信',
    meta: {
      authority: [authority.login]
    },
    component: () => import('../views/user/user-chat')
  },
  userSignIn: {
    path: '/user/signIn',
    text: '登录',
    component: () => import('../views/user/user-sign').then(t => t.SignIn)
  },
  userSignUp: {
    path: '/user/signUp',
    text: '注册',
    component: () => import('../views/user/user-sign').then(t => t.SignUpView)
  },

  goods: {
    path: '/goods',
    text: '商品',
    component: () => import('../views/goods/goods')
  },
  goodsDetail: {
    path: '/goods/detail',
    text: '商品',
    component: () => import('../views/goods/goods-detail')
  },
  goodsMgt: {
    path: '/goodsMgt',
    text: '商品管理',
    component: () => import('../views/goods/goods-mgt'),
    meta: {
      authority: [authority.login]
    }
  },
  goodsMgtEdit: {
    path: '/goodsMgt/edit',
    text: '商品管理',
    component: () => import('../views/goods/goods-mgt-detail'),
    meta: {
      authority: [authority.login]
    }
  },
  goodsMgtDetail: {
    path: '/goodsMgt/detail',
    text: '商品管理',
    component: () => import('../views/goods/goods-mgt-detail'),
    meta: {
      authority: [authority.login]
    }
  },

  contentMgt: {
    path: '/contentMgt',
    text: '投稿管理',
    meta: {
      authority: [authority.login]
    },
    component: () => import('../views/content/content-mgt')
  },

  article: {
    path: '/article',
    text: '文章',
    component: () => import('../views/content/article')
  },
  articleDetail: {
    path: '/article/detail',
    text: '文章',
    component: () => import('../views/content/article-detail')
  },
  articleMgtEdit: {
    path: '/contentMgt/article/edit',
    text: '编辑文章',
    meta: {
      authority: [authority.login]
    },
    component: () => import('../views/content/article-mgt-detail')
  },
  articleMgtDetail: {
    path: '/contentMgt/article/detail',
    text: '查看文章',
    meta: {
      authority: [authority.login]
    },
    component: () => import('../views/content/article-mgt-detail')
  },

  video: {
    path: '/video',
    text: '视频',
    component: () => import('../views/content/video')
  },
  videoDetail: {
    path: '/video/detail',
    text: '视频',
    component: () => import('../views/content/video-detail')
  },
  videoMgtEdit: {
    path: '/contentMgt/video/edit',
    text: '编辑视频',
    meta: {
      authority: [authority.login]
    },
    component: () => import('../views/content/video-mgt-detail')
  },
  videoMgtDetail: {
    path: '/contentMgt/video/detail',
    text: '查看视频',
    meta: {
      authority: [authority.login]
    },
    component: () => import('../views/content/video-mgt-detail')
  },
  viewHistory: {
    path: '/my/view-history',
    text: '浏览记录',
    meta: {
      authority: [authority.login]
    },
    component: () => import('../views/content/view-history')
  },

  payMgt: {
    path: '/payMgt',
    text: '支付',
    meta: {
      authority: [authority.login]
    },
    component: () => import('../views/pay-mgt')
  },

  imgMgt: {
    path: '/imgMgt',
    text: '图片',
    component: () => import('../views/img-mgt'),
    meta: {
      authority: [authority.login]
    }
  },

  wxAuth: {
    path: '/wx/auth',
    text: '微信授权',
    component: () => import('../views/wx-auth')
  },

  printMgt: {
    path: '/printTempMgt',
    text: '模板管理',
    component: () => import('../views/print-temp-mgt')
  },
  printMgtDetail: {
    path: '/printTempMgt/detail',
    text: '模板设置',
    component: () => import('../views/print')
  },
  printPreview: {
    path: '/print/preview',
    text: '打印',
    component: () => import('../views/print')
  }
}

const mergeCfg = {
  ...cfg,
  ...cfgAdmin,
  ...cfgApps,
  ...cfgTest
}
export default {
  ...mergeCfg,

  // 首页
  home: mergeCfg.article,

  error: {
    path: errPath,
    text: '出错啦',
    component: () => import('../views/error')
  },
  notFound: {
    path: '*',
    redirect: {
      path: errPath,
      query: { code: error.NOT_FOUND.code }
    }
  }
}
