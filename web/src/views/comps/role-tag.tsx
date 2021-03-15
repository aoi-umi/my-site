import { Component, Vue, Watch } from 'vue-property-decorator'

import { Prop } from '@/components/property-decorator'
import { myEnum } from '@/config'
import { convClass, getCompOpts } from '@/components/utils'
import { MyTagBase } from '@/components/my-tag/my-tag'
import { Tooltip } from '@/components/iview'
import { DetailDataType } from '../system/role'
import { AuthorityTagView } from './authority-tag'

class RoleTagProp {
    @Prop({
      default: []
    })
    value: DetailDataType[];

    @Prop()
    hideCode?: boolean;
}
@Component({
  extends: MyTagBase,
  mixins: [getCompOpts(RoleTagProp)]
})
class RoleTag extends Vue<RoleTagProp & MyTagBase<DetailDataType>> {
  render () {
    return (
      <div>
        {this.tagList.map(ele => {
          let color = ''
          let tag = ele.code
          if (ele.isDel || ele.status !== myEnum.roleStatus.启用) {
            color = 'default'
          } else {
            tag = `${ele.name}` + (this.hideCode ? '' : `(${ele.code})`)
          }
          return (
            <Tooltip theme='light' max-width='250' disabled={!ele.authorityList || !ele.authorityList.length}>
              <div slot='content' >
                <AuthorityTagView value={ele.authorityList} />
              </div>
              {
                this.renderTag({
                  tag,
                  color,
                  isDel: ele.isDel
                })
              }
            </Tooltip>
          )
        })}
      </div>
    )
  }
}

export const RoleTagView = convClass<RoleTagProp>(RoleTag)
export interface IRoleTagView extends RoleTag { };
