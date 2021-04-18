import { Component, Vue, Watch } from 'vue-property-decorator'

import { testApi } from '@/api'
import { convert, OperateModel } from '@/helpers'

import { Input, Button, Checkbox, Row, Col, Select, Form, FormItem, InputNumber, Tabs, TabPane } from '@/components/iview'

import { Prop } from '@/components/decorator'
import { MyList, IMyList, Const as MyListConst, MyListModel } from '@/components/my-list'
import { routerConfig } from '@/router'
import { IMyLoad, MyLoad } from '@/components/my-load'
import { DynamicCompConfigType } from '@/components/my-dynamic-comp'
import { myEnum } from '@/config'
const { dynamicCompType, dynamicSqlCalcType, dynamicCompViewType } = myEnum
import { convClass, getCompOpts, Utils } from '@/components/utils'
import { MyDetail, MyDetailView } from '@/components/my-detail'
import { MyButtonsModel } from '@/components/my-buttons'

import { Base } from '../base'
import './comp-mgt.less'

const SelectOptionsType = {
  extraValue: 'extraValue',
  自定义: 'custom'
}

type CompModuleType = {
  _id?: string
  name: string;
  text: string;
  group: string;
  sort?: number;
}

export class CompProp {
  @Prop()
  itemOnly?: boolean

  @Prop({
    default: () => []
  })
  configList?: DynamicCompConfigType[]

  @Prop({
    default: () => []
  })
  moduleList?: CompModuleType[]
}

@Component({
  extends: Base,
  mixins: [getCompOpts(CompProp)]

})
export default class CompView extends Vue<Base & CompProp> {
  stylePrefix = 'comp-mgt-detail-'
  $refs: {
    loadView: IMyLoad, formVaild: iView.Form,
    main: MyDetailView, module: IMyList, config: IMyList
  };

  private op: OperateModel = null
  protected created () {
    this.op = this.getOpModel({
      prefix: '保存',
      noValidMessage: true,
      noSuccessHandler: true,
      fn: async (type) => {
        switch (type) {
          case 'main':
            await this.mainSave()
            break
          case 'module':
            await this.moduleSave()
            break
          case 'config':
            await this.configSave()
            break
          case 'configQuery':
            await this.configQuery()
            break
        }
      }
    })
    this.mainInit()
    this.moduleInit()
    this.configInit()
  }

  protected mounted () {
    this.query()
  }

  @Watch('$route')
  private route (to, from) {
    this.query()
  }

  private _id = ''
  query () {
    const query = this.$route.query
    this._id = query._id as string
    this.refresh()
  }

  refresh () {
    this.$refs.loadView.loadData()
  }

  private detail: { main: any } = null
  async loadDetail () {
    let detail
    if (this._id) {
      detail = await testApi.compMgtDetailQuery({ _id: this._id })
    } else {
      detail = {
        main: {}
      }
    }
    this.setModuleList(detail.moduleList || [])
    this.detail = detail
  }

  get hasDetail () {
    return !!this.detail?.main._id
  }

  async afterLoad () {
  }

  setModuleList (data: Partial<CompModuleType>[]) {
    this.moduleList.splice(0, this.moduleList.length, ...data as any)
  }

  setConfigList (data: Partial<DynamicCompConfigType>[]) {
    this.configList.splice(0, this.configList.length, ...data.map((ele: any, index) => {
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

  protected render () {
    return (
      <MyLoad
        ref='loadView'
        outLoading={this.op.loading}
        loadFn={this.loadDetail}
        afterLoad={this.afterLoad}
        renderFn={() => {
          return this.renderMain()
        }}
      />
    )
  }

  protected renderMain () {
    return (
      <div class={this.getStyleName('root')}>
        {this.itemOnly ? this.renderItem()
          : (
            <Tabs>
              <TabPane label='基本信息'>
                {this.renderBaseInfo()}
              </TabPane>
              <TabPane label='配置信息' disabled={!this.hasDetail}>
                {this.renderModule()}
                {(this.selectModuleIdx >= 0) && <div>
                  当前模块: {this.moduleList[this.selectModuleIdx].name}
                  {this.renderItem()}
                </div>}
              </TabPane>
            </Tabs>
          )
        }
      </div>
    )
  }

  protected mainBtns: MyButtonsModel[] = []
  private mainInit () {
    this.mainBtns = [{
      name: 'save',
      text: '保存',
      click: () => {
        this.op.run('main')
      }
    }]
  }

  private async mainSave () {
    let valid = await this.$refs.main.valid()
    if (!valid.success) return
    let rs = await testApi.compMgtSave(this.detail.main)
    this._id = rs._id
    this.refresh()
  }

  protected mainConfig: DynamicCompConfigType[] = [{
    name: 'name',
    text: '名字',
    required: true,
    editable: true
  }, {
    name: 'text',
    text: '显示',
    required: true,
    editable: true
  }]
  protected renderBaseInfo () {
    return <MyDetail ref='main' itemConfigs={this.mainConfig} dynamicCompOptions={{
      data: this.detail.main,
      editable: true
    }} buttonConfigs={this.mainBtns} />
  }

  private moduleBtns: MyButtonsModel[] = []
  private selectModuleIdx = -1
  private moduleConfig: DynamicCompConfigType[] = [{
    name: 'name',
    text: '名字',
    required: true,
    editable: true
  }, {
    name: 'text',
    text: '显示',
    required: true,
    editable: true
  }, {
    name: 'viewType',
    text: '类型',
    editable: true,
    type: dynamicCompType.选择器,
    actOptions: dynamicCompViewType as any
  }, {
    name: 'group',
    text: '分组',
    editable: true
  }]

  private moduleInit () {
    this.moduleBtns = [{
      name: 'add',
      text: '新增',
      click: () => {
        this.moduleList.push(Utils.getObjByDynCfg(this.moduleConfig))
      }
    }, {
      name: 'save',
      text: '保存',
      click: () => {
        this.op.run('module')
      }
    }]
  }

  private async moduleSave () {
    let valid = await this.$refs.module.valid()
    if (!valid.success) return
    let rs = await testApi.compMgtModuleSave({
      compId: this._id,
      moduleList: this.moduleList
    })
    this.moduleList = rs.moduleList
  }

  protected renderModule () {
    return (
      <div>
        <MyList
          ref='module'
          draggable
          tableHeight={300}
          itemConfigs={this.moduleConfig}
          columns={[{
            key: 'op',
            title: '操作',
            render: (h, params) => {
              return (<div class={this.getStyleName('op')}>
                {params.row._id && <a on-click={() => {
                  this.selectModuleIdx = params['index']
                  this.op.run('configQuery')
                }}>编辑</a>}
                <a on-click={() => {
                  if (this.selectModuleIdx === params['index']) { this.selectModuleIdx = -1 }
                  this.moduleList.splice(params['index'], 1)
                }}>删除</a>
              </div>)
            }
          }]}
          data={this.moduleList}
          hideSearchBox
          hidePage
          buttonConfigs={this.moduleBtns}
        >
          模块
        </MyList>
      </div>
    )
  }

  private selectConfig: DynamicCompConfigType = null
  private selectOption: any

  selectOptionValChange (event) {
    try {
      let val = this.selectConfig.options
      if (this.selectConfig.optionType === SelectOptionsType.extraValue) { this.selectOption = val } else { this.selectOption = JSON.parse(val) }
      this.updateSelectOption()
    } catch (e) { }
  }

  updateSelectOption () {
    this.selectConfig.actOptions = this.selectOption
  }

  rules = {
    name: [
      { required: true }
    ],
    text: [
      { required: true }
    ]
  }
  private configBtns: MyButtonsModel[] = []
  private configInit () {
    this.configBtns = [{
      name: 'add',
      text: '新增',
      click: () => {
        this.configList.push(this.getConfigObj({
          name: '',
          text: '',
          type: 'input'
        }))
      }
    }, {
      name: 'save',
      text: '保存',
      click: () => {
        this.op.run('config')
      }
    }]
  }

  private async configQuery () {
    let m = this.moduleList[this.selectModuleIdx]
    let rs = await testApi.compMgtConfigQuery({
      compId: this._id,
      moduleId: m._id
    })
    this.setConfigList(rs)
  }

  private async configSave () {
    let valid = await Utils.valid({ data: this.configList }, {
      data: {
        type: 'array',
        defaultField: {
          type: 'object',
          fields: this.rules
        }
      }
    })
    if (!valid.success) return
    let m = this.moduleList[this.selectModuleIdx]
    await testApi.compMgtConfigSave({
      compId: this._id,
      moduleId: m._id,
      configList: this.configList
    })
  }

  protected renderItem () {
    return (
      <Row class={this.getStyleName('config')} gutter={5}>
        <Col xs={12}>
          <MyList
            ref='config'
            draggable
            tableHeight={300}
            on-current-change={(obj) => {
              this.selectConfig = obj.currentRow
            }}
            columns={[{
              key: 'name',
              title: '名称'
            }, {
              key: 'text',
              title: '显示文本'
            }, {
              key: 'op',
              title: '操作',
              render: (h, params) => {
                return (<div>
                  <a on-click={() => {
                    this.configList.splice(params['index'], 1)
                  }}>删除</a>
                </div>)
              }
            }]}
            data={this.configList}
            buttonConfigs={this.configBtns}
            hideSearchBox
            hidePage
          >
          </MyList>
        </Col>
        <Col xs={12}>
          {this.renderSetting()}
        </Col>
      </Row>
    )
  }

  renderSetting () {
    if (!this.selectConfig) return <div />
    return (
      <Form props={{ model: this.selectConfig }} label-width={80} show-message={false} rules={this.rules}>
        <FormItem label='名字' prop='name'>
          <Input v-model={this.selectConfig.name} on-on-change={() => {
            this.$emit('name-change')
          }}>
          </Input>
        </FormItem>
        <FormItem label='显示文本' prop='text'>
          <Input v-model={this.selectConfig.text}>
          </Input>
        </FormItem>
        <FormItem label='类型'>
          <Select v-model={this.selectConfig.type}>
            {this.renderOptionByObj(dynamicCompType)}
          </Select>
        </FormItem>

        <FormItem label='必填'>
          <Checkbox v-model={this.selectConfig.required} />
        </FormItem>
        <FormItem label='可编辑'>
          <Checkbox v-model={this.selectConfig.editable} />
        </FormItem>
        <FormItem label='禁用'>
          <Checkbox v-model={this.selectConfig.disabled} />
        </FormItem>
        <FormItem label='占比(1-24)'>
          <InputNumber v-model={this.selectConfig.size} />
        </FormItem>
        <FormItem label='宽度'>
          <InputNumber v-model={this.selectConfig.width} />
        </FormItem>

        <FormItem label='计算'>
          <Select v-model={this.selectConfig.calcType}>
            {this.renderOptionByObj(dynamicSqlCalcType)}
          </Select>
        </FormItem>
        {[dynamicCompType.日期, dynamicCompType.日期时间].includes(this.selectConfig.type) && <FormItem label='范围'>
          <Checkbox v-model={this.selectConfig.isRange} />
        </FormItem>}

        {[dynamicCompType.选择器].includes(this.selectConfig.type) &&
          <div>
            <FormItem label='取值类型'>
              <Select v-model={this.selectConfig.optionType}>
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
              <Input v-model={this.selectConfig.options} on-on-change={(val) => {
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
