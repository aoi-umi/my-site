import _Vue from 'vue'
import { Watch } from 'vue-property-decorator'
import VueDND from 'awe-dnd'

import { Component, Vue } from './decorator'
import { Utils } from './utils'

_Vue.use(VueDND)
@Component
export class MyBase extends Vue {
  protected stylePrefix = 'base-';
  getStyleName (...args: string[]) {
    return Utils.getStyleName(this.stylePrefix, ...args)
  }

  // 防抖
  protected debounce (fn: Function, delay = 500) {
    let timer = null
    return function () {
      if (timer) {
        clearTimeout(timer)
        timer = setTimeout(fn, delay)
      } else {
        timer = setTimeout(fn, delay)
      }
    }
  }
}
