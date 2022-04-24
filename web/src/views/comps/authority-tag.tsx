import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop } from '@/components/decorator'
import { MyTagBase, MyTagBaseProp } from '@/components/my-tag/my-tag'
import { myEnum } from '@/config'

export type AuthorityDetail = {
  isDel?: boolean
  code?: string
  status: number
  name: string
}

class AuthorityTagProp extends MyTagBaseProp {
  @Prop()
  hideCode?: boolean
}
@Component({
  extends: MyTagBase,
  props: AuthorityTagProp,
})
export class AuthorityTag extends Vue<
  AuthorityTagProp,
  MyTagBase<AuthorityDetail>
> {
  private convert(ele: AuthorityDetail) {
    let color = ''
    let tag = ele.code
    if (ele.isDel || ele.status !== myEnum.authorityStatus.启用) {
      color = 'default'
    } else {
      tag = `${ele.name}` + (this.hideCode ? '' : `(${ele.code})`)
    }
    return {
      tag,
      color,
      isDel: ele.isDel,
    }
  }

  render() {
    return this.renderTag(this.tagList.map((ele) => this.convert(ele)))
  }
}
