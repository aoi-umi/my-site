import { Watch } from 'vue-property-decorator'

import { testApi } from '@/api'
import { convert, OperateModel } from '@/helpers'

import { Input, Button, Checkbox, Row, Col, Select, Form, FormItem, InputNumber, Tabs, TabPane, Divider } from '@/components/iview'

import { Prop, Vue, Component } from '@/components/decorator'
import { MyList, IMyList } from '@/components/my-list'
import { routerConfig } from '@/router'
import { IMyLoad, MyLoad } from '@/components/my-load'
import { DynamicCompConfigType, DynamicCompSelectOptionsType, DynamicCompPropType, DynamicCompConfigFnType } from '@/components/my-dynamic-comp'
import { myEnum } from '@/config'
const { dynamicCompType, dynamicSqlCalcType, dynamicCompViewType } = myEnum
import { convClass, getCompOpts, Utils } from '@/components/utils'
import { MyDetail, MyDetailView } from '@/components/my-detail'
import { MyButtonsModel } from '@/components/my-buttons'

import { Base } from '../base'
import { CompDetail } from './comp-detail'
import './comp-mgt.less'

export type CompModuleType = {
  _id?: string
  name: string;
  text: string;
  viewType: string;
  group: string;
  sort?: number;

  itemList?: DynamicCompConfigType[]
  itemProp?: DynamicCompPropType
  itemDynamicConfigFn?: DynamicCompConfigFnType,
  buttonList?: MyButtonsModel[]
}

export class CompMgtDetailProp {
  @Prop()
  itemOnly?: boolean

  @Prop({
    default: () => []
  })
  itemList?: DynamicCompConfigType[]

  @Prop({
    default: () => []
  })
  buttonList?: MyButtonsModel[]

  @Prop({
    default: () => []
  })
  moduleList?: CompModuleType[]
}

@Component({
  extends: Base,
  props: CompMgtDetailProp
})
export class CompMgtDetail extends Vue<CompMgtDetailProp, Base> {
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
        if (['main', 'module', 'config'].includes(type)) { this.$Message.success('保存成功') }
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

  setItemList (data: Partial<DynamicCompConfigType>[]) {
    this.itemList.splice(0, this.itemList.length, ...data.map((ele: any, index) => {
      return this.getItemObj(ele)
    }))
    this.setConfigData()
    this.selectConfig = null
  }

  getDefaultItem () {
    return {
      editable: true,
      calcType: '',
      queryMode: null,
      isRange: false,
      optionType: null,
      options: null,
      queryMatchMode: {
        show: this.selectedModule?.viewType === dynamicCompViewType.查询条件,
        value: null
      }
    }
  }

  private getItemObj (ele: DynamicCompConfigType) {
    return {
      ...this.getDefaultItem(),
      ...ele
    }
  }

  setButtonList (data: Partial<MyButtonsModel>[]) {
    this.buttonList.splice(0, this.buttonList.length, ...data.map((ele: any, index) => {
      return ele
    }))
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
                {(this.selectedModuleIdx >= 0) && <div>
                  <Divider />
                  <div>
                    当前模块: {this.selectedModule.name}
                  </div>
                  <Button on-click={() => {
                    this.op.run('config')
                  }} type='primary'>保存</Button>
                  <Tabs>
                    <TabPane label='字段设置'>
                      {this.renderItem()}
                    </TabPane>
                    <TabPane label='按钮设置'>
                      {this.renderButtonConfig()}
                    </TabPane>
                  </Tabs>

                  <Divider />
                  {this.renderPreview()}
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
      type: 'primary',
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
  private selectedModuleIdx = -1
  private get selectedModule () {
    if (this.selectedModuleIdx >= 0) { return this.moduleList[this.selectedModuleIdx] }
  }
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
    name: 'disabled',
    text: '禁用',
    type: dynamicCompType.多选框,
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
  moduleProp = {
    viewType: {
      event: {
        onChange: ({ data }) => {
          if (data === this.selectedModule) {
            this.itemList.forEach(ele => {
              if (this.selectedModule.viewType === dynamicCompViewType.查询条件) {
                if (ele.queryMatchMode) { ele.queryMatchMode.show = true }
              } else {
                if (ele.queryMatchMode) { ele.queryMatchMode.show = false }
              }
            })
          }
        }
      }
    }
  }

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
      type: 'primary',
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
          dynamicCompOptions={{
            compProp: this.moduleProp
          }}
          columns={[{
            key: 'op',
            title: '操作',
            render: (h, params) => {
              return (<div class={this.getStyleName('op')}>
                {params.row._id && <a on-click={() => {
                  this.selectedModuleIdx = params['index']
                  this.op.run('configQuery')
                }}>编辑</a>}
                <a on-click={() => {
                  if (this.selectedModuleIdx === params['index']) { this.selectedModuleIdx = -1 }
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
      if (this.selectConfig.optionType === DynamicCompSelectOptionsType.extraValue) {
        this.selectOption = val
      } else { this.selectOption = JSON.parse(val) }
      this.updateSelectOption()
    } catch (e) { }
  }

  updateSelectOption () {
    this.selectConfig.actOptions = this.selectOption
  }

  private defConfigData = {}
  rules = {
    name: [
      { required: true }
    ],
    text: [
      { required: true }
    ]
  }
  private configBtns: MyButtonsModel[] = []
  private buttonBtns: MyButtonsModel[] = []
  private buttonConfig: DynamicCompConfigType[] = [{
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
    name: 'disabled',
    text: '禁用',
    type: dynamicCompType.多选框,
    editable: true
  }, {
    name: 'group',
    text: '分组',
    editable: true
  }]
  private configInit () {
    this.configBtns = [{
      name: 'add',
      text: '新增',
      click: () => {
        this.itemList.push(this.getItemObj({
          name: '',
          text: '',
          type: 'input'
        }))
      }
    }]
    this.buttonBtns = [{
      name: 'add',
      text: '新增',
      click: () => {
        this.buttonList.push(Utils.getObjByDynCfg(this.buttonConfig))
      }
    }]
  }

  private async configQuery () {
    let m = this.selectedModule
    let rs = await testApi.compMgtConfigQuery({
      compId: this._id,
      moduleId: m._id
    })
    this.setItemList(rs.itemList)
    this.setButtonList(rs.buttonList)
  }

  private async configSave () {
    let itemValid = await Utils.valid({ data: this.itemList }, {
      data: {
        type: 'array',
        defaultField: {
          type: 'object',
          fields: this.rules
        }
      }
    })
    if (!itemValid.success) return

    let btnRules = Utils.getValidRulesByDynCfg(this.buttonConfig)
    let buttonValid = await Utils.valid({ data: this.buttonList }, {
      data: {
        type: 'array',
        defaultField: {
          type: 'object',
          fields: btnRules
        }
      }
    })
    if (!buttonValid.success) return

    let m = this.selectedModule
    let rs = await testApi.compMgtConfigSave({
      compId: this._id,
      moduleId: m._id,
      buttonList: this.buttonList,
      itemList: this.itemList.map(ele => {
        return {
          ...ele,
          queryMode: ele.queryMatchMode?.value
        }
      })
    })
    this.setItemList(rs.itemList)
    this.setButtonList(rs.buttonList)
  }

  private setConfigData () {
    this.defConfigData = Utils.getObjByDynCfg(this.itemList)
  }

  protected renderButtonConfig () {
    return (
      <MyList
        ref='buttonConfig'
        draggable
        tableHeight={300}
        data={this.buttonList}
        buttonConfigs={this.buttonBtns}
        hideSearchBox
        hidePage
        itemConfigs={this.buttonConfig}
        columns={[{
          key: 'op',
          title: '操作',
          render: (h, params) => {
            return (<div>
              <a on-click={() => {
                this.buttonList.splice(params['index'], 1)
              }}>删除</a>
            </div>)
          }
        }]}
      />
    )
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
              title: '显示'
            }, {
              key: 'op',
              title: '操作',
              render: (h, params) => {
                return (<div>
                  <a on-click={() => {
                    this.itemList.splice(params['index'], 1)
                  }}>删除</a>
                </div>)
              }
            }]}
            data={this.itemList}
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

  protected renderSetting () {
    if (!this.selectConfig) return <div />
    return (
      <Form props={{ model: this.selectConfig }} label-width={80} show-message={false} rules={this.rules}>
        <FormItem label='名字' prop='name'>
          <Input v-model={this.selectConfig.name} on-on-change={() => {
            this.$emit('name-change')
            this.setConfigData()
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
        <FormItem label='占比'>
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
                {this.renderOptionByObj(DynamicCompSelectOptionsType)}
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

  protected renderPreview () {
    let m = this.selectedModule
    let data = {
      [m.name]: m.viewType === dynamicCompViewType.列表
        ? [this.defConfigData] : this.defConfigData
    }
    return <CompDetail
      data={data}
      compConfig={{
        main: {},
        moduleList: [{
          ...m,
          itemList: this.itemList.filter(ele => !ele.disabled),
          buttonList: this.buttonList.filter(ele => !ele.disabled)
        }]
      }} />
  }
}

export default CompMgtDetail

