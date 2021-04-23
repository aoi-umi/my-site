
import { Component, Vue, Watch } from 'vue-property-decorator'

import { myEnum } from '@/config'
const { dynamicCompViewType } = myEnum
import { getCompOpts, convClass, Utils } from '@/components/utils'
import { Base } from '@/views/base'
import { IMyLoad, MyLoad } from '@/components/my-load'
import { testApi } from '@/api'
import { MyButtonsModel } from '@/components/my-buttons'
import { DynamicCompEventType } from '@/components/my-dynamic-comp'
import { Button } from '@/components/iview'

import { CompDetail, CompDetailType, CompDetailView } from '../comp-mgt/comp-detail'
import { CompModuleType } from '../comp-mgt/comp-mgt-detail'

@Component
export default class CompDetailPage extends Base {
  $refs: {
    loadView: IMyLoad,
    comp: CompDetailView
  };

  created () {
    this.init()
  }

  private name = 'test'
  private compConfig: CompDetailType = null
  private data = null
  private moduleList: DeepPartial<CompModuleType>[] = []

  private addEnable = true
  init () {
    this.moduleList = [{
      name: 'test22',
      buttonList: [{
        name: 'add',
        click: (btn) => {
          this.click(btn)
        },
        enable: () => {
          return this.addEnable
        }
      }, {
        name: 'update',
        click: (btn) => {
          this.click(btn)
        }
      }, {
        name: 'test',
        click: (btn) => {
          this.addEnable = !this.addEnable
        }
      }],
      itemProp: {
        'test11111': {
          event: {
            onChange: (args) => {
              this.handler(args)
            }
          }
        },
        'tt': {
          event: {
            onChange: (args) => {
              this.handler(args)
            }
          }
        }
      },
      itemDynamicConfigFn: ({ config, name, value, data }) => {
        if (name === 'test11111') {
          return {
            editable: !data.test24
          }
        }
      }
    }]
  }

  private click (btn: MyButtonsModel) {
    this.$Message.info(`点击了${btn.name}`)
  }

  private handler (args: DynamicCompEventType) {
    console.log(`${args.config.name}: 触发了事件`)
    console.log(args)
  }

  async loadDetail () {
    this.compConfig = await testApi.compDetailQuery({ name: this.name })
    let data = {}
    this.compConfig.moduleList = this.$utils.dynamicCompMergeModule(this.compConfig.moduleList, this.moduleList)
    this.compConfig.moduleList.forEach(ele => {
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
    return <div>
      <Button on-click={() => {
        this.valid()
      }}>测试校验</Button>
      <CompDetail ref='comp' compConfig={this.compConfig} data={this.data} />
    </div>
  }

  private async valid () {
    let rs = await this.$refs.comp.valid()
    console.log(rs)
  }
}
