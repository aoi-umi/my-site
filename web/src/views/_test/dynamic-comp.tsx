
import { Component, Vue, Watch } from 'vue-property-decorator'

import { Input, Card, Button, Checkbox, Row, Col, Select, Option, Form, FormItem, Divider } from '@/components/iview'

import { MyList } from '@/components/my-list'
import { DynamicComp, DynamicCompType, DynamicCompConfigType } from '@/components/my-dynamic-comp'
import { Base } from '../base'

@Component({})
export default class App extends Base {
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
  selectRow: DynamicCompConfigType = null
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
    return { editable: true }
  }
  created () {
    this.configList = Object.entries({
      ...DynamicCompType,
      不可编辑输入框: {
        name: 'dis-input',
        editable: false,
        type: 'input'
      },
      动态组件: {
        name: 'dyn-input'
      }
    }).map((ele, index) => {
      let val = ele[1]
      let text = ele[0]
      let name = ''; let type = ''
      if (typeof val === 'string') { name = val } else {
        name = val.name
        type = val.type
      }
      if (!type) type = name
      let obj = {
        ...this.getDefaultConfig(),
        name,
        text,
        type: type,
        isRange: false,
        options: 'options',
        remark: `${text}_${name}`
      }
      if (!(typeof val === 'string')) {
        obj = {
          ...obj,
          ...val
        }
      }
      return obj
    })
    this.setData()
  }

  dynamicConfig ({ config, name, value, data }) {
    if (name === 'dyn-input') {
      if (data.input === 'disabled') return { editable: false }
      if (data.input === 'required') return { required: true }
      if (DynamicCompType[data.input]) return { type: DynamicCompType[data.input] }
    }
    return
  }

  changeOption () {
    this.extraValue.options = {
      选项2: 'option2',
      选项1: 'option1'
    }
  }

  getData (d?) {
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
  setData () {
    this.data = this.getData()
    this.listData = [this.getData(), this.getData({ input: 'required' })]
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
                this.configList.push({
                  ...this.getDefaultConfig(),
                  name: 'unknow',
                  text: '未命名',
                  type: 'input'
                })
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
          <Row>
            {this.configList.map(ele => {
              return (
                <Col xs={6}>
                  <DynamicComp style='margin: 0 5px 5px 0'
                    config={ele}
                    data={this.data}
                    compProp={this.compProp}
                    showText
                    editable={this.editable}
                    readonlyType='disabled'
                    extraValue={this.extraValue}
                    dynamicConfig={this.dynamicConfig}
                  />
                </Col>
              )
            })}
          </Row>
        </div>
        <MyList hideSearchBox colConfigs={this.configList} dynamicCompOptions={
          {
            extraValue: this.extraValue,
            editable: this.editable,
            dynamicConfig: this.dynamicConfig,
            compProp: this.compProp
          }
        }
        data={this.listData}></MyList>
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
            {this.$utils.obj2arr(DynamicCompType).map(ele => {
              return (
                <i-option key={ele.key} value={ele.value}>
                  {ele.key}
                </i-option>
              )
            })}
          </Select>
        </FormItem>

        <FormItem label='必填'>
          <Checkbox v-model={this.selectRow.required} />
        </FormItem>

        {[DynamicCompType.日期, DynamicCompType.日期时间].includes(this.selectRow.type) && <FormItem label='范围'>
          <Checkbox v-model={this.selectRow.isRange} />
        </FormItem>}

        {[DynamicCompType.选择器].includes(this.selectRow.type) &&
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
