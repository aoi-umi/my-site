import Vue from 'vue'
import Vuex, { Store } from 'vuex'

import LoginUserStore from './login-user'
import SettingStore from './setting'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    user: LoginUserStore,
    setting: SettingStore
  }
})

export * from './local-store'
