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
}
