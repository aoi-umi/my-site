const appsPath = '/apps'

export default {
  apps: {
    path: appsPath,
    text: '应用',
    component: () => import('../views/apps/apps')
  },

  xiaobianBot: {
    path: appsPath + '/xiaobianBot',
    text: '小编bot',
    component: () => import('../views/apps/xiaobian-bot')
  },

  beautify: {
    path: appsPath + '/json',
    text: 'json',
    component: () => import('../views/apps/json')
  },
  stat: {
    path: '/stat',
    text: '统计',
    component: () => import('../views/stat/user')
  }
}
