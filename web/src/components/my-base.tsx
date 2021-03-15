import { Component, Vue, Watch } from 'vue-property-decorator'
import VueDND from 'awe-dnd'

import { Utils } from './utils'

Vue.use(VueDND)
@Component
export class MyBase extends Vue {
    protected stylePrefix = 'base-';
    getStyleName (...args: string[]) {
      return Utils.getStyleName(this.stylePrefix, ...args)
    }
}
