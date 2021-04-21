import { Component, Vue, Watch } from 'vue-property-decorator'

import { testApi } from '@/api'
import { myEnum } from '@/config'
const { dynamicCompViewType } = myEnum
import { MyDetail } from '@/components/my-detail'
import { MyList } from '@/components/my-list'
import { MyLoad, IMyLoad } from '@/components/my-load'
import { getCompOpts, convClass, Utils, MyGroupType } from '@/components/utils'
import { Prop } from '@/components/decorator'
import { Divider, Tabs, TabPane } from '@/components/iview'

import { Base } from '../base'
import { CompModuleType } from './comp-mgt-detail'

@Component
export default class CompDetailPage extends Base {
  $refs: {
    loadView: IMyLoad
  };

  private _id = ''
  private detail: CompDetailType = null
  private data = null

  async loadDetail () {
    const query = this.$route.query
    this._id = query._id as string
    this.detail = await testApi.compDetailQuery({ _id: this._id })
    let data = {}
    this.detail.moduleList.forEach(ele => {
      let d = Utils.getObjByDynCfg(ele.itemList)
      if (ele.viewType === dynamicCompViewType.列表) {
        data[ele.name] = [d]
      } else {
        data[ele.name] = d
      }
    })
    this.data = data
  }

  protected render () {
    return (
      <div>
        <MyLoad
          ref='loadView'
          loadFn={this.loadDetail}
          renderFn={() => {
            return this.renderDetail()
          }} />
      </div>
    )
  }

  protected renderDetail () {
    return <CompDetail compConfig={this.detail} data={this.data} />
  }
}

type CompDetailType = {
  main: any
  moduleList: Partial<CompModuleType>[]
}

export class CompDetailProp {
  @Prop()
  data: any

  @Prop()
  compConfig: CompDetailType
}

@Component({
  extends: Base,
  mixins: [getCompOpts(CompDetailProp)]
})
class CompDetailView extends Vue<Base & CompDetailProp> {
  @Watch('compConfig', { immediate: true })
  private watchCompConfig () {
    this.setDetail(this.compConfig)
  }
  private moduleGroup: MyGroupType<CompModuleType>[] = [];
  private setDetail (val: CompDetailType) {
    let obj = Utils.group(val.moduleList as CompModuleType[], (v) => {
      let name = v.group ? `_group_${v.group}` : v.name
      if (!name) return
      let text = v.group || v.text
      return {
        name,
        text
      }
    })
    this.moduleGroup = obj
  }

  protected render () {
    return (
      <div>
        {this.moduleGroup.map((g, idx) => {
          return (
            <div>
              {<Divider orientation='left'>{g.group.text}</Divider>}
              {g.child.length <= 1 ? g.child.map(m => {
                return this.renderModule(m)
              }) : (
                <Tabs>
                  {g.child.map(m => {
                    return <TabPane label={m.text}>
                      {this.renderModule(m)}
                    </TabPane>
                  })}
                </Tabs>
              )

              }
            </div>
          )
        })}
      </div>
    )
  }

  protected renderModule (m: CompModuleType) {
    m.itemList.forEach(ele => {
      if (!ele.queryMatchMode) ele.queryMatchMode = {}
      ele.queryMatchMode.show = m.viewType === dynamicCompViewType.查询条件
    })
    if (m.viewType === dynamicCompViewType.列表) {
      return <MyList
        hideSearchBox
        hidePage
        data={this.data[m.name]}
        itemConfigs={m.itemList}
        buttonConfigs={m.buttonList} />
    } else {
      return <MyDetail
        itemConfigs={m.itemList}
        buttonConfigs={m.buttonList}
        dynamicCompOptions={
          { data: this.data[m.name] }
        } />
    }
  }
}

export const CompDetail = convClass<CompDetailProp>(CompDetailView)
