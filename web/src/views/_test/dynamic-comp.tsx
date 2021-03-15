
import { Component, Vue, Watch } from 'vue-property-decorator'

import { Input, Card, Button, Checkbox, Row, Col, Select, Option, Form, FormItem } from '@/components/iview'

import { MyList } from '@/components/my-list'
import { DynamicComp, DynamicCompType, DynamicCompConfigType } from '@/components/my-dynamic-comp'
import { Base } from '../base'

@Component({})
export default class App extends Base {
  configList: DynamicCompConfigType[] = []
  data = {}
  selectRow: DynamicCompConfigType = null
  editable = true

  extraValue = {
    options: [{
      label: '选项1',
      value: 'option1'
    }] as any
  }

  getDefaultConfig () {
    return { editable: true }
  }
  created () {
    this.configList = Object.entries({
      ...DynamicCompType,
      不可编辑输入框: {
        name: 'input',
        editable: false
      },
      动态组件: {
        name: 'dyn-input'
      }
    }).map((ele, index) => {
      let val = ele[1]
      let text = ele[0]
      let name = ''
      if (typeof val === 'string') { name = val } else name = val.name
      let obj = {
        ...this.getDefaultConfig(),
        name,
        text,
        type: name,
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
  }

  render () {
    return (
      <div>
        <span>动态组件</span>
        <Row gutter={5}>
          <Col xs={12}>
            <MyList
              tableHeight={200}
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
            dynamicConfig: this.dynamicConfig
          }
        }
        data={[this.getData(), this.getData({ input: 'required' })]}></MyList>
      </div>
    )
  }

  renderSetting () {
    if (!this.selectRow) return <div />
    return (
      <Form label-width={50} show-message={false}>
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

        <FormItem label='isRange'>
          <Checkbox v-model={this.selectRow.isRange} />
        </FormItem>

        <FormItem label='required'>
          <Checkbox v-model={this.selectRow.required} />
        </FormItem>
      </Form>
    )
  }
}
