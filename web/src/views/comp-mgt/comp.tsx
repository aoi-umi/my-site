import { Component, Vue, Watch } from 'vue-property-decorator'

import { testApi } from '@/api'
import { convert } from '@/helpers'

import { Input, Button, Checkbox, Row, Col, Select, Form, FormItem, InputNumber } from '@/components/iview'

import { Prop } from '@/components/decorator'
import { MyList, IMyList, Const as MyListConst, MyListModel } from '@/components/my-list'
import { routerConfig } from '@/router'
import { IMyLoad, MyLoad } from '@/components/my-load'
import { DynamicCompConfigType } from '@/components/my-dynamic-comp'
import { myEnum } from '@/config'
const { dynamicCompType, dynamicSqlCalcType } = myEnum
import { convClass, getCompOpts } from '@/components/utils'

import { Base } from '../base'

const SelectOptionsType = {
  extraValue: 'extraValue',
  自定义: 'custom'
}

export class CompProp {
  @Prop({
    default: () => []
  })
  configList?: DynamicCompConfigType[]
}

@Component({
  extends: Base,
  mixins: [getCompOpts(CompProp)]

})
export default class CompView extends Vue<Base & CompProp> {
  $refs: { loadView: IMyLoad, formVaild: iView.Form };

  selectRow: DynamicCompConfigType & {
    // my detail
    size?: number
    // my list
    width?: number
  } = null

  @Watch('$route')
  route (to, from) {
    this.$refs.loadView.loadData()
  }

  async loadDetail () {
    const query = this.$route.query
    let detail
    if (query._id) {
      detail = await testApi.compMgtDetailQuery({ _id: query._id })
    } else { }
  }

  async afterLoad () {
  }

  setConfigList (data: Partial<DynamicCompConfigType>[]) {
    this.configList.splice(0, this.configList.length)
    this.configList.push(...data.map((ele: any, index) => {
      return this.getConfigObj(ele)
    }))
  }

  getDefaultConfig () {
    return {
      editable: true,
      calcType: '',
      queryMatchMode: null,
      isRange: false,
      optionType: null,
      options: null
    }
  }

  private getConfigObj (ele: DynamicCompConfigType) {
    let actOptions
    if (typeof ele.actOptions === 'function') {
      actOptions = ele.actOptions
    } else if (ele.optionType === SelectOptionsType.extraValue) {
      actOptions = ele.options
    } else if (ele.options) {
      actOptions = JSON.parse(ele.options)
    }
    return {
      ...this.getDefaultConfig(),
      ...ele,
      actOptions
    }
  }

  selectOption: any

  selectOptionValChange (event) {
    try {
      let val = this.selectRow.options
      if (this.selectRow.optionType === SelectOptionsType.extraValue) { this.selectOption = val } else { this.selectOption = JSON.parse(val) }
      this.updateSelectOption()
    } catch (e) { }
  }

  updateSelectOption () {
    this.selectRow.actOptions = this.selectOption
  }

  rules = {
    name: [
      { required: true, trigger: 'blur' }
    ],
    text: [
      { required: true, trigger: 'blur' }
    ]
  }

  protected render () {
    return (
      <MyLoad
        ref='loadView'
        loadFn={this.loadDetail}
        renderFn={() => {
          return this.renderMain()
        }}
        afterLoad={this.afterLoad}
      />
    )
  }

  protected renderMain () {
    return (
      <div class={this.getStyleName('root')}>
        <Row gutter={5}>
          <Col xs={12}>
            <MyList
              tableHeight={300}
              on-current-change={(obj) => {
                this.selectRow = obj.currentRow
              }}
              columns={[{
                key: 'name',
                title: '名称'
              }, {
                key: 'text',
                title: '显示文本'
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
                  name: '',
                  text: '',
                  type: 'input'
                }))
              }}>新增</Button>
            </MyList>
          </Col>
          <Col xs={12}>

            {this.renderSetting()}
          </Col>
        </Row>
      </div>
    )
  }

  renderSetting () {
    if (!this.selectRow) return <div />
    return (
      <Form label-width={80} show-message={false} rules={this.rules}>
        <FormItem label='name' prop='name'>
          <Input v-model={this.selectRow.name} on-on-change={() => {
            this.$emit('name-change')
          }}>
          </Input>
        </FormItem>
        <FormItem label='text' prop='text'>
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

        <FormItem label='计算'>
          <Select v-model={this.selectRow.calcType}>
            {this.renderOptionByObj(dynamicSqlCalcType)}
          </Select>
        </FormItem>
        {[dynamicCompType.日期, dynamicCompType.日期时间].includes(this.selectRow.type) && <FormItem label='范围'>
          <Checkbox v-model={this.selectRow.isRange} />
        </FormItem>}

        {[dynamicCompType.选择器].includes(this.selectRow.type) &&
          <div>
            <FormItem label='取值类型'>
              <Select v-model={this.selectRow.optionType}>
                {this.renderOptionByObj(SelectOptionsType)}
              </Select>
            </FormItem>
            <FormItem>
              <div>
                自定义为json格式：{[
                  { Obj选项: 'obj' },
                  [{ label: '列表选项', value: 'list' }]
                ].map(ele => JSON.stringify(ele)).join(' 或 ')}
              </div>

            </FormItem>
            <FormItem label='取值'>
              <Input v-model={this.selectRow.options} on-on-change={(val) => {
                this.selectOptionValChange(val)
              }} />
            </FormItem>
          </div>
        }
      </Form>
    )
  }
}

export const Comp = convClass<CompProp>(CompView)
