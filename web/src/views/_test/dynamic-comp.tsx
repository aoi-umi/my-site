
import { Component, Vue, Watch } from 'vue-property-decorator'

import { Input, Card, Button, Checkbox, Row, Col, Select, Option, Form, FormItem, Divider, InputNumber } from '@/components/iview'

import { MyList } from '@/components/my-list'
import { DynamicComp, DynamicCompConfigType } from '@/components/my-dynamic-comp'
import { myEnum } from '@/config'
const { dynamicCompType, dynamicSqlCalcType } = myEnum
import { MyBase } from '@/components/my-base'
import { getCompOpts, convClass } from '@/components/utils'
import { Prop } from '@/components/decorator'
import MyDetail from '@/components/my-detail/my-detail'
import { Base } from '@/views/base'

export class DynamicCompDemoProp {
  @Prop()
  comp?: boolean;

  @Prop()
  advQuery?: boolean

  @Prop()
  colConfig?: any
}
@Component({
  extends: Base,
  mixins: [getCompOpts(DynamicCompDemoProp)]
})
export default class App extends Vue<DynamicCompDemoProp & Base> {
  configList: DynamicCompConfigType[] = []
  data = {}
  listData = []
  compProp = {
    input: {
      event: {
        onChange: (...args) => {
          console.log(args)
        }
      }
    },
    select: {
      event: {
        onChange: (...args) => {
          console.log(args)
        }
      }
    }
  }
  selectRow: DynamicCompConfigType & {
    // my detail
    size?: number
    // my list
    width?: number
  } = null
  editable = true

  extraValue = {
    options: [{
      label: '选项1',
      value: 'option1'
    }] as any,
    options2: {
      选项2: 'option2',
      选项1: 'option1'
    }
  }

  getDefaultConfig () {
    return { editable: true, calcType: '' }
  }
  created () {
    if (!this.comp) {
      this.setConfigList(Object.entries({
        ...dynamicCompType,
        不可编辑输入框: {
          name: 'dis-input',
          editable: false,
          type: 'input'
        },
        动态组件: {
          name: 'dyn-input',
          size: 2,
          width: 200
        }
      }).map((ele: any) => {
        let val = ele[1]
        let text = ele[0]
        let name = ''; let type = ''
        if (typeof val === 'string') { name = val } else {
          name = val.name
          type = val.type
        }
        if (!type) type = name

        let obj = {
          name,
          type,
          text,
          remark: `${text}_${name}`
        }
        if (typeof val !== 'string') {
          obj = {
            ...obj,
            ...val
          }
        }
        return obj
      }))
      this.setData()
    }
  }

  setConfigList (data: Partial<DynamicCompConfigType>[]) {
    this.configList.splice(0, this.configList.length)
    this.configList.push(...data.map((ele: any, index) => {
      return this.getConfigObj(ele)
    }))
  }

  private getConfigObj (ele) {
    return {
      ...this.getDefaultConfig(),
      isRange: false,
      options: 'options',
      queryMatchMode: this.advQuery ? { show: true, value: '' } : null,
      ...ele
    }
  }

  dynamicConfig ({ config, name, value, data }) {
    if (name === 'dyn-input') {
      if (data.input === 'disabled') return { editable: false }
      if (data.input === 'required') return { required: true }
      if (dynamicCompType[data.input]) return { type: dynamicCompType[data.input] }
    }
    return
  }

  changeOption () {
    this.extraValue.options = {
      选项2: 'option2',
      选项1: 'option1'
    }
  }

  private getData (d?) {
    let data = {}
    this.configList.forEach(ele => {
      data[ele.name] = null
    })
    data['input'] = 'disabled'
    data['select'] = 'option1'
    if (d) {
      data = {
        ...data,
        ...d
      }
    }
    return data
  }
  private setData () {
    this.data = this.getData()
    this.listData = [this.getData(), this.getData({ input: 'required' })]
  }

  getAdvData () {
    let data = {}
    this.configList.forEach(ele => {
      data[ele.name] = {
        mode: ele.queryMatchMode?.value,
        value: this.data[ele.name]
      }
    })
    return data
  }

  getFields () {
    let data = {}
    this.configList.forEach(ele => {
      data[ele.name] = {
        name: ele.name,
        calcType: ele.calcType
      }
    })
    return data
  }

  selectType = ''
  selectOption: any

  selectOptionValChange (event) {
    try {
      let val = event.target.value
      if (this.selectType === 'extraValue') { this.selectOption = val } else { this.selectOption = JSON.parse(val) }
      this.updateSelectOption()
    } catch (e) { }
  }
  updateSelectOption () {
    this.selectRow.options = this.selectOption
  }

  render () {
    return (
      <div>
        <span>动态组件</span>
        <Row gutter={5}>
          <Col xs={12}>
            <MyList
              tableHeight={300}
              on-current-change={(obj) => {
                this.selectRow = obj.currentRow
              }}
              columns={[{
                key: 'name',
                render: (h, params) => {
                  return (<div>{params.row.name}</div>)
                }
              }, {
                key: 'op',
                title: '删除',
                render: (h, params) => {
                  return (<div>
                    <a on-click={() => {
                      this.configList.splice(params['index'], 1)
                    }}>删除</a>
                  </div>)
                }
              }]}
              data={this.configList}
              hideSearchBox
              hidePage
            >
              <Button on-click={() => {
                this.configList.push(this.getConfigObj({
                  name: 'unknow',
                  text: '未命名',
                  type: 'input'
                }))
              }}>新增</Button>
            </MyList>
          </Col>
          <Col xs={12}>
            <div>
              <Checkbox v-model={this.editable}>可编辑</Checkbox>

              <Button on-click={() => {
                this.changeOption()
              }}>修改选项</Button>
              <Button on-click={() => {
                console.log(this.data)
                console.log(this.listData)
              }}>查看</Button>
            </div>
            {this.renderSetting()}
          </Col>
        </Row>
        <div>
          <MyDetail itemConfigs={this.configList} dynamicCompOptions={
            {
              data: this.data,
              extraValue: this.extraValue,
              editable: this.editable,
              dynamicConfig: this.dynamicConfig,
              compProp: this.compProp
            }
          } colConfig={this.colConfig}/>
        </div>
        {!this.comp && <MyList hideSearchBox itemConfigs={this.configList} dynamicCompOptions={
          {
            extraValue: this.extraValue,
            editable: this.editable,
            dynamicConfig: this.dynamicConfig,
            compProp: this.compProp
          }
        }
        data={this.listData}></MyList>}
      </div>
    )
  }

  renderSetting () {
    if (!this.selectRow) return <div />
    return (
      <Form label-width={80} show-message={false}>
        <FormItem label='name'>
          <Input v-model={this.selectRow.name} on-on-change={() => {
            this.setData()
          }}>
          </Input>
        </FormItem>
        <FormItem label='text'>
          <Input v-model={this.selectRow.text}>
          </Input>
        </FormItem>
        <FormItem label='type'>
          <Select v-model={this.selectRow.type}>
            {this.renderOptionByObj(dynamicCompType)}
          </Select>
        </FormItem>

        <FormItem label='必填'>
          <Checkbox v-model={this.selectRow.required} />
        </FormItem>
        <FormItem label='size'>
          <InputNumber v-model={this.selectRow.size} />
        </FormItem>
        <FormItem label='width'>
          <InputNumber v-model={this.selectRow.width} />
        </FormItem>

        {this.advQuery && <FormItem label='计算'>
          <Select v-model={this.selectRow.calcType}>
            {this.renderOptionByObj(dynamicSqlCalcType)}
          </Select>
        </FormItem>}
        {[dynamicCompType.日期, dynamicCompType.日期时间].includes(this.selectRow.type) && <FormItem label='范围'>
          <Checkbox v-model={this.selectRow.isRange} />
        </FormItem>}

        {[dynamicCompType.选择器].includes(this.selectRow.type) &&
          <div>
            <FormItem label='取值类型'>
              <Select v-model={this.selectType}>
                <i-option value='extraValue'>extraValue</i-option>
                <i-option value='custom'>自定义</i-option>
              </Select>
            </FormItem>
            <FormItem>
              <div>
                extraValue可选值：{Object.keys(this.extraValue).join(', ')}
              </div>
              <div>
                自定义为json格式：{[
                  { Obj选项: 'obj' },
                  [{ label: '列表选项', value: 'list' }]
                ].map(ele => JSON.stringify(ele)).join(' 或 ')}
              </div>

            </FormItem>
            <FormItem label='取值'>
              <Input on-on-change={(val) => {
                this.selectOptionValChange(val)
              }} />
            </FormItem>
          </div>
        }
      </Form>
    )
  }
}

export const DynamicCompDemo = convClass<DynamicCompDemoProp>(App)
