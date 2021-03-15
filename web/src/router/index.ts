import Vue from 'vue'
import Router, { RouteConfig } from 'vue-router'
import { getModule } from 'vuex-module-decorators'
import iview from 'iview'
const ViewUI = iview as any

import { authority } from '../config'
import store from '../store'
import LoginUserStore from '../store/login-user'
import routeCfg from './cfg'

Vue.use(Router)
export const routerConfig = routeCfg
export type MyRouteConfig = RouteConfig & { text?: string; };

export const getConfigByPath = (path) => {
  for (const key in routeCfg) {
    const cfg = routeCfg[key]
    if (cfg.path == path) { return cfg as MyRouteConfig }
  }
}

const routes: MyRouteConfig[] = Object.values(routeCfg)
routes.forEach(ele => {
  if (!ele.meta) {
    ele.meta = {}
  }
  if (!ele.meta.title) {
    ele.meta.title = ele.text
  }
})

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})
router.beforeEach((to, from, next) => {
  ViewUI.LoadingBar.start()
  if (to.path == routeCfg.index.path) {
    return next(routeCfg.home.path)
  }
  const auth = to.meta && to.meta.authority
  const userMod = getModule(LoginUserStore, store)
  if (auth && auth.includes(authority.login) && !userMod.user.isLogin) {
    return next({ path: routeCfg.userSignIn.path, query: { to: to.path, ...to.query }})
  }
  next()
})
router.afterEach(route => {
  ViewUI.LoadingBar.finish()
})
export default router
