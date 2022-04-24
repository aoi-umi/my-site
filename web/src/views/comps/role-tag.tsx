import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop } from '@/components/decorator'
import { myEnum } from '@/config'
import { MyTagBase } from '@/components/my-tag/my-tag'
import { Tooltip } from '@/components/iview'
import { DetailDataType } from '../system/role'
import { AuthorityTag } from './authority-tag'

class RoleTagProp {
  @Prop({
    default: [],
  })
  value: DetailDataType[]

  @Prop()
  hideCode?: boolean
}
@Component({
  extends: MyTagBase,
  props: RoleTagProp,
})
export class RoleTag extends Vue<RoleTagProp, MyTagBase<DetailDataType>> {
  render() {
    return (
      <div>
        {this.tagList.map((ele) => {
          let color = ''
          let tag = ele.code
          if (ele.isDel || ele.status !== myEnum.roleStatus.启用) {
            color = 'default'
          } else {
            tag = `${ele.name}` + (this.hideCode ? '' : `(${ele.code})`)
          }
          return (
            <Tooltip
              theme="light"
              max-width="250"
              disabled={!ele.authorityList || !ele.authorityList.length}
            >
              <div slot="content">
                <AuthorityTag value={ele.authorityList} />
              </div>
              {this.renderTag({
                tag,
                color,
                isDel: ele.isDel,
              })}
            </Tooltip>
          )
        })}
      </div>
    )
  }
}
