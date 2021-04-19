import { Component, Vue, Watch } from 'vue-property-decorator'

import { testApi } from '@/api'
import { myEnum } from '@/config'
const { dynamicCompViewType } = myEnum
import { MyDetail } from '@/components/my-detail'
import { MyList } from '@/components/my-list'
import { MyLoad, IMyLoad } from '@/components/my-load'
import { getCompOpts, convClass, Utils } from '@/components/utils'
import { Prop } from '@/components/decorator'

import { Base } from '../base'
import { CompModuleType } from './comp-mgt-detail'
import { Divider } from '@/components/iview'

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
    this.detail = this.compConfig
  }
  private detail: CompDetailType;
  protected render () {
    return (
      <div>
        {this.detail.moduleList.map((m, idx) => {
          m.itemList.forEach(ele => {
            if (!ele.queryMatchMode) ele.queryMatchMode = {}
            ele.queryMatchMode.show = m.viewType === dynamicCompViewType.查询条件
          })
          let view
          if (m.viewType === dynamicCompViewType.列表) {
            view = <MyList
              hideSearchBox
              hidePage
              data={this.data[m.name]}
              itemConfigs={m.itemList}
              buttonConfigs={m.buttonList} />
          } else {
            view = <MyDetail
              itemConfigs={m.itemList}
              buttonConfigs={m.buttonList}
              dynamicCompOptions={
                { data: this.data[m.name] }
              } />
          }
          return (
            <div>
              {view}
              {this.detail.moduleList.length > 1 && idx < this.detail.moduleList.length - 1 && <Divider/>}
            </div>
          )
        })}
      </div>
    )
  }
}

export const CompDetail = convClass<CompDetailProp>(CompDetailView)
