import { Watch } from 'vue-property-decorator'

import { Button, Checkbox } from '@/components/iview'

import { Component, Vue, Prop } from '@/components/decorator'
import { MyList } from '@/components/my-list'
import {
  DynamicComp,
  DynamicCompConfigType,
} from '@/components/my-dynamic-comp'
import { myEnum } from '@/config'
const { dynamicCompType, dynamicSqlCalcType } = myEnum
import { MyDetail } from '@/components/my-detail'
import { Base } from '@/views/base'
import CompMgtDetailView, { CompMgtDetail } from '../comp-mgt/comp-mgt-detail'

export class DynamicCompDemoProp {
  @Prop()
  comp?: boolean

  @Prop()
  advQuery?: boolean

  @Prop()
  colConfig?: any
}
@Component({
  extends: Base,
  props: DynamicCompDemoProp,
})
export default class DynamicCompDemo extends Vue<DynamicCompDemoProp, Base> {
  $refs: { comp: CompMgtDetailView }
  itemList: DynamicCompConfigType[] = []
  data = {}
  listData = []
  compProp = {
    input: {
      event: {
        onChange: (...args) => {
          console.log(args)
        },
      },
    },
    select: {
      event: {
        onChange: (...args) => {
          console.log(args)
        },
      },
    },
  }
  editable = true

  extraValue = {
    options: [
      {
        label: '选项1',
        value: 'option1',
      },
    ] as any,
    options2: {
      选项2: 'option2',
      选项1: 'option1',
    },
  }

  mounted() {
    if (!this.comp) {
      this.$refs.comp.setItemList(
        Object.entries({
          ...dynamicCompType,
          不可编辑输入框: {
            name: 'dis-input',
            editable: false,
            type: 'input',
          },
          动态组件: {
            name: 'dyn-input',
            size: 2,
            width: 200,
          },
          动态Select: {
            name: 'dyn-select',
            type: 'select',
            actOptions: async (val) => {
              console.log(new Date(), '模拟调用接口')
              await this.$utils.wait(1000)
              return this.$utils
                .obj2arr({
                  a: 'a',
                  ab: 'ab',
                  b: 'b',
                })
                .filter(
                  (ele) =>
                    !val || ele.key.includes(val) || ele.value.includes(val),
                )
            },
          },
        }).map((ele: any) => {
          let val = ele[1]
          let text = ele[0]
          let name = ''
          let type = ''
          if (typeof val === 'string') {
            name = val
          } else {
            name = val.name
            type = val.type
          }
          if (!type) type = name

          let obj: any = {
            name,
            type,
            text,
            remark: `${text}_${name}`,
          }
          if (typeof val !== 'string') {
            obj = {
              ...obj,
              ...val,
            }
          }
          if (obj.name === 'select') {
            obj.optionType = 'extraValue'
            obj.options = 'options'
          }
          return obj
        }),
      )
      this.setData()
    }
  }

  dynamicConfig({ config, name, value, data }) {
    if (name === 'dyn-input') {
      if (data.input === 'no-edit') return { editable: false }
      if (data.input === 'required') return { required: true }
      if (dynamicCompType[data.input])
        return { type: dynamicCompType[data.input] }
    }
    return
  }

  changeOption() {
    this.extraValue.options = {
      选项2: 'option2',
      选项1: 'option1',
    }
  }

  private getData(d?) {
    let data = {}
    this.itemList.forEach((ele) => {
      data[ele.name] = null
    })
    data['input'] = 'no-edit'
    data['select'] = 'option1'
    if (d) {
      data = {
        ...data,
        ...d,
      }
    }
    return data
  }
  private setData() {
    this.data = this.getData()
    this.listData = [this.getData(), this.getData({ input: 'required' })]
  }

  getAdvData() {
    let data = {}
    this.itemList.forEach((ele) => {
      data[ele.name] = {
        mode: ele.queryMatchMode?.value,
        value: this.data[ele.name],
      }
    })
    return data
  }

  getFields() {
    let data = {}
    this.itemList.forEach((ele) => {
      data[ele.name] = {
        name: ele.name,
        calcType: ele.calcType,
      }
    })
    return data
  }

  setConfigList(data: Partial<DynamicCompConfigType>[]) {
    this.$refs.comp.setItemList(data)
  }

  render() {
    return (
      <div>
        <span>动态组件</span>
        <CompMgtDetail
          ref="comp"
          itemOnly
          itemList={this.itemList}
          on-name-change={() => {
            this.setData()
          }}
        />
        <div>
          <Checkbox v-model={this.editable}>可编辑</Checkbox>

          <Button
            on-click={() => {
              this.changeOption()
            }}
          >
            修改选项
          </Button>
          <Button
            on-click={() => {
              console.log(this.data)
              console.log(this.listData)
            }}
          >
            查看
          </Button>
        </div>

        <div>
          <MyDetail
            itemConfigs={this.itemList}
            dynamicCompOptions={{
              data: this.data,
              extraValue: this.extraValue,
              editable: this.editable,
              dynamicConfigFn: this.dynamicConfig,
              compProp: this.compProp,
            }}
            colConfig={this.colConfig}
          />
        </div>
        {!this.comp && (
          <MyList
            hideSearchBox
            itemConfigs={this.itemList}
            dynamicCompOptions={{
              extraValue: this.extraValue,
              editable: this.editable,
              dynamicConfigFn: this.dynamicConfig,
              compProp: this.compProp,
            }}
            data={this.listData}
          ></MyList>
        )}
      </div>
    )
  }
}
