import Vue from 'vue'
import iView from 'iview'
import VueLazyload from 'vue-lazyload'

import 'iview/dist/styles/iview.css'

Vue.use(iView)
Vue.use(VueLazyload, {
  loading: 'data:image/gif;base64,R0lGODlhDwAPAPQAAJWVlaqqqr+/v9XV1dnZ2bKyssXFxZ+fn6CgoOHh4efn583NzbOzs97e3u/v7/X19eXl5cbGxu3t7aurq+rq6vPz87y8vAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh/wtYTVAgRGF0YVhNUP8/eHBhY2tldCBiZWdpbj0i72lkOjQzREFENjZENuHg397d3Nva2djX1tXU09LR0M/OzczLysnIx8bFxMPCwcC/vr28u7q5uLe2tbSzsrGwr66trKuqqainpqWko6KhoJ+enZybmpmYl5aVlJOSkZCPjo2Mi4qJiIeGhYSDgoGAf359fHt6eXh3dnV0c3JxcG9ubWxramloZ2ZlZGNiYWBfXl1cW1pZWFdWVVRTUlFQT05NTEtKSUhHRkVEQ0JBQD8+PTw7Ojk4NzY1NDMyMTAvLi0sKyopKCcmJSQjIiEgHx4dHBsaGRgXFhUUExIREA8ODQwLCgkIBwYFBAMCAQAAIfkEBRQAEAAsAAAAAA8ADwAABULg0wwkCQkoujhEWZ4parhvnNKmjeIDbPO+GFAngBiPyCRgyQRAAtBooMl8SqHUpfWadV6x2a0UEf4yEgeqOFBQhAAAIfkEBRQACAAsAAAAAA8ADwAABUIgNAEkiQwo2jxHWZ4pSrhvnNKmjeIAbPO+GFA3QBiPyGRgyQwgBNCooMl8SqHUpfWadV6x2a2UEf5GFAWqWGCQhAAAIfkEBRQACAAsAAAAAA8ADwAABUIgZQUkiQAoOkFFWZ4perhvnNKmjeIBbPO+GFAHQBiPyKRgyRQgBtDooMl8SqHUpfWadV6x2a00Ev4SJAaqeECohAAAIfkEBRQACgAsAAAAAA8ADwAABUKgswgkqQQoalFGWZ4pWrhvnNKmjeICbPO+GFAXUBiPyORgyRwoANAooMl8SqHUpfWadV6x2a2UEP4iKuSmGHBIhAAAOw==',
  error: 'data:image/png;'
})

import Utils from '@/plugins/utils'
Vue.use(Utils)

import App from './App'
import router from './router'
import store from './store'
import { env } from './config'

import './assets/style/index.less'

Vue.config.productionTip = false
document.title = env.title
new Vue({
  router,
  store,
  render: (h) => h(App)
}).$mount('#app')
