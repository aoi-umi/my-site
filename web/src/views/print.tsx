import { Component, Vue, Watch } from 'vue-property-decorator'
import * as iview from 'iview'

import {
  Button, Input, Row, Col, Collapse, Panel, Divider,
  Form, FormItem, Spin
} from '@/components/iview'
import { IMyLoad, MyLoad } from '@/components/my-load'
import { testApi } from '@/api'
import { OperateModel } from '@/helpers'
import { routerConfig } from '@/router'

import { Base } from './base'

import '@public/hiprint/css/hiprint.css'
import '@public/hiprint/css/print-lock.css'
import './print.less'

type ItemGroup = {
  title: string
  items: Item[]
}

type Item = {
  tid: string;
  text: string;
  icon: string;
}

type DetailDataType = {
  _id?: string;
  name?: string;
  data?: any
};

type PrintDataType = {
  label?: string;
  template: any;
  data: any[];
}
@Component
export default class Print extends Base {
  stylePrefix = 'print-'
  $refs: { loadView: IMyLoad, formVaild: iview.Form };
  hiprintTemplate: any
  itemGroups: ItemGroup[] = []
  testData: any = ''
  detail: DetailDataType = this.getDetailData()
  initPromise: Promise<void>;
  printData: PrintDataType[] = []
  currPrintData: PrintDataType

  private rules = {
    name: [
      { required: true, trigger: 'blur' }
    ]
  };

  created () {
    this.createdInit()
  }
  mounted () {
  }

  @Watch('$route')
  route (to, from) {
    this.$refs.loadView.loadData()
  }

  private getDetailData () {
    return {
      _id: null,
      name: '',
      data: null
    }
  }

  get preview () {
    return location.pathname === routerConfig.printPreview.path
  }

  saveOpModel: OperateModel = null
  async createdInit () {
    this.initPromise = new Promise(async (resolve, reject) => {
      await this.getScript()
      resolve()
    })

    this.itemGroups = [{
      title: '拖拽列表',
      items: [{
        tid: 'testModule.text',
        text: '文本',
        icon: 'glyphicon-text-width'
      }, {
        tid: 'testModule.image',
        text: '图片',
        icon: 'glyphicon-picture'
      }, {
        tid: 'testModule.longText',
        text: '长文',
        icon: 'glyphicon-subscript'
      },
      // {
      //   tid: 'testModule.table',
      //   text: '表格',
      //   icon: 'glyphicon-th'
      // },
      {
        tid: 'testModule.tableCustom',
        text: '表格',
        icon: 'glyphicon-th'
      },
      {
        tid: 'testModule.html',
        text: 'html',
        icon: 'glyphicon-header'
      }]
    }, {
      title: '辅助',
      items: [{
        tid: 'testModule.hline',
        text: '横线',
        icon: 'glyphicon-resize-horizontal'
      }, {
        tid: 'testModule.vline',
        text: '竖线',
        icon: 'glyphicon-resize-vertical'
      }, {
        tid: 'testModule.rect',
        text: '矩形',
        icon: 'glyphicon-unchecked'
      }, {
        tid: 'testModule.oval',
        text: '椭圆',
        icon: 'glyphicon-record'
      }]
    }]

    this.saveOpModel = this.getOpModel({
      prefix: '保存',
      validate: () => {
        return this.$refs.formVaild.validate()
      },
      fn: async () => {
        let saveData = {
          ...this.detail,
          data: this.hiprintTemplate.getJson()
        }
        let rs = await testApi.printMgtSave(saveData)
        if (!this.detail._id) { this.detail._id = rs._id }
      }
    })
  }

  setTestData (obj?) {
    this.testData = JSON.stringify(obj || {}, null, '\t')
  }

  getTestData () {
    return JSON.parse(this.testData)
  }

  async loadDetail () {
    const query = this.$route.query
    if (!this.preview) {
      let detail: DetailDataType
      if (query._id) {
        detail = await testApi.printMgtDetailQuery({ _id: query._id })
      } else {
        detail = this.getDetailData() as any
        detail.data = { 'panels': [{ 'index': 0, 'paperType': 'A4', 'height': 297, 'width': 210, 'paperHeader': 43.5, 'paperFooter': 801, 'printElements': [{ 'options': { 'left': 27, 'top': 30, 'height': 9.75, 'width': 33, 'title': 'hello,' }, 'printElementType': { 'type': 'text' }}, { 'options': { 'left': 57, 'top': 30, 'height': 12, 'width': 121.5, 'field': 'name', 'testData': 'world' }, 'printElementType': { 'type': 'text' }}, { 'options': { 'left': 12, 'top': 103.5, 'height': 36, 'width': 550, 'field': 'table', 'columns': [[{ 'title': '列1', 'field': 'col1', 'width': 232.69230769230768, 'colspan': 1, 'rowspan': 1, 'checked': true, 'columnId': 'col1' }, { 'title': '列2', 'field': 'col2', 'width': 162.6925576923077, 'colspan': 1, 'rowspan': 1, 'checked': true, 'columnId': 'col2' }, { 'title': '列3', 'field': 'col3', 'width': 154.6151346153846, 'colspan': 1, 'rowspan': 1, 'checked': true, 'columnId': 'col3' }]] }, 'printElementType': { 'title': '表格', 'type': 'tableCustom' }}, { 'options': { 'left': 25.5, 'top': 177, 'height': 90, 'width': 90, 'formatter': 'function(value, options, data) {\n data = data || {} \n return `<a href="#">${data.name} html test</a>`\n}' }, 'printElementType': { 'title': 'html', 'type': 'html' }}, { 'options': { 'left': 12, 'top': 223.5, 'height': 124.5, 'width': 126, 'field': 'img', 'src': 'https://cn.vuejs.org/images/logo.png' }, 'printElementType': { 'type': 'image' }}], 'paperNumberLeft': 565.5, 'paperNumberTop': 819, 'paperNumberDisabled': true }] }
      }

      this.detail = detail
    } else {
      this.printData = await testApi.printGetData({ type: 'test' })
    }
  }

  async afterLoad () {
    await this.initPromise
    if (!this.preview) { await this.initEdit() } else { await this.updatePreview(this.printData[0]) }
  }

  async initEdit () {
    hiprint.init({
      providers: [new customElementTypeProvider()],
      paginationContainer: '.hiprint-printPagination'
    })

    // 设置左侧拖拽事件
    hiprint.PrintElementTypeManager.buildByHtml($('.ep-draggable-item'))

    await this.setTemplate(this.detail.data)
    this.updateTestData()
  }

  createTestData (temp) {
    let data
    if (temp && temp.panels) {
      data = {}
      for (let panel of temp.panels) {
        for (let ele of panel.printElements) {
          let field = ele.options.field
          let type = ele.printElementType.type
          let val = data[field]
          switch (type) {
            case 'tableCustom':
              if (!val) { val = [] }
              let obj = val[0]
              if (!obj) {
                obj = {}
                val.push(obj)
              }
              let columns = ele.options.columns[0]
              columns.forEach(col => {
                obj[col.field] = col.field
              })
              break
            case 'image':
              val = ele.options.src || ''
              break
            default:
              val = field
              break
          }
          if (field) { data[field] = val }
        }
      }
    }
    return data
  }

  updateTestData () {
    let testData = this.createTestData(this.hiprintTemplate.getJson())
    this.setTestData(testData)
  }

  async setTemplate (template) {
    await this.initPromise
    let hiprintTemplate = this.hiprintTemplate = new hiprint.PrintTemplate({
      template,
      settingContainer: '#PrintElementOptionSetting',
      paginationContainer: '.hiprint-printPagination'
    })
    // 打印设计
    $('#hiprint-printTemplate').html('')
    hiprintTemplate.design('#hiprint-printTemplate')
  }

  async getScript () {
    let scripts = [
      '/hiprint/polyfill.min.js',
      '/hiprint/plugins/jquery.minicolors.min.js',
      '/hiprint/plugins/JsBarcode.all.min.js',
      '/hiprint/plugins/qrcode.js',
      '/hiprint/hiprint.bundle.js',
      '/hiprint/custom_test/config-etype-provider.js',
      '/hiprint/custom_test/custom-etype-provider.js',
      '/hiprint/plugins/jquery.hiwprint.js'
      // 'https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/js/bootstrap.min.js'
    ]
    await this.$utils.loadScript(scripts)
  }

  // 调整纸张
  setPaper (paperTypeOrWidth, height?) {
    let { hiprintTemplate } = this
    hiprintTemplate.setPaper(paperTypeOrWidth, height)
  }

  // 旋转
  rotatePaper () {
    let { hiprintTemplate } = this
    hiprintTemplate.rotatePaper()
  }
  clearTemplate () {
    let { hiprintTemplate } = this
    hiprintTemplate.clear()
  }

  print () {
    this.operateHandler('打印', () => {
      let data = this.preview ? this.currPrintData.data : this.getTestData()
      this.hiprintTemplate.print(data)
    }, {
      noSuccessHandler: true
    })
  }

  save () {
    this.saveOpModel.run()
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
        {this.preview
          ? this.renderPreview()
          : this.renderEdit()
        }
      </div>
    )
  }

  protected renderEdit () {
    let { detail } = this
    return (
      <Row gutter={10}>
        <Col sm={24} lg={6}>
          <Collapse value='0'>
            <Panel>
              属性
              <div slot='content'>
                <Form ref='formVaild' label-position='top' props={{ model: detail }} rules={this.rules}>
                  <FormItem label='模板名称' prop='name'>
                    <Input v-model={detail.name} />
                  </FormItem>
                  <FormItem label='测试数据' prop='testData'>
                    <Input type='textarea' v-model={this.testData} rows={4} />
                  </FormItem>
                </Form>

                <Divider />
                <div id='PrintElementOptionSetting' style='margin-top:10px;'></div>
              </div>
            </Panel>
            <Panel>
              组件
              <div slot='content'>
                {this.renderSideBar()}
              </div>
            </Panel>
          </Collapse>
        </Col>
        <Col sm={24} lg={18}>
          {this.renderMainPage()}
        </Col>
      </Row>
    )
  }

  protected renderSideBar () {
    return (
      <div class='rect-printElement-types hiprintEpContainer'>
        <ul class='hiprint-printElement-type'>
          {this.itemGroups.map(ele => {
            return (
              <li>
                <span class='title'><code>{ele.title}</code></span>
                <ul>
                  {ele.items.map(item => {
                    return (
                      <li>
                        <a class='ep-draggable-item' tid={item.tid} style=''>
                          <span class={['glyphicon', item.icon]} aria-hidden='true'></span>
                          <span class='glyphicon-class'>{item.text}</span>
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  protected renderMainPage () {
    return (
      <div>
        <div class='hiprint-toolbar' style='margin-top:15px;'>
          <ul>
            {[
              'A3', 'A4', 'A5',
              'B3', 'B4', 'B5'
            ].map(ele => {
              return (
                <li><a class='hiprint-toolbar-item' on-click={() => {
                  this.setPaper(ele)
                }}>{ele}</a></li>
              )
            })}

            <li><a class='hiprint-toolbar-item'><input type='text' id='customWidth' style='width: 50px;height: 19px;border: 0px;' placeholder='宽/mm' /></a></li>
            <li><a class='hiprint-toolbar-item'><input type='text' id='customHeight' style='width: 50px;height: 19px;border: 0px;' placeholder='高/mm' /></a></li>

            <li><a class='hiprint-toolbar-item' on-click={() => {
              let width = $('#customWidth').val()
              let height = $('#customHeight').val()
              if (!width || isNaN(width) || !height || isNaN(height)) { return this.$Message.warning('请输入正确的宽高') }
              this.setPaper(width, height)
            }}>自定义</a></li>
            <li><a class='hiprint-toolbar-item' on-click={this.rotatePaper}>旋转</a></li>
            <li><a class='hiprint-toolbar-item' on-click={this.clearTemplate}>清空</a></li>

            <li>
              <a class={['btn hiprint-toolbar-item ', ...this.getStyleName('important-btn')]} on-click={() => {
                this.print()
              }}>打印</a>
            </li>
            <li>
              <a class={['btn hiprint-toolbar-item ', ...this.getStyleName('important-btn')]} on-click={() => {
                this.save()
              }}>
                保存
                {this.saveOpModel.loading && <Spin fix />}
              </a>
            </li>
            <li>
              <a class={['btn hiprint-toolbar-item ', ...this.getStyleName('important-btn')]} on-click={() => {
                this.updateTestData()
              }}>更新测试数据</a>
            </li>
          </ul>
          <div style='clear:both;'></div>
        </div>
        <div class='hiprint-printPagination'></div>
        <div style='width:820px;overflow-x:auto;overflow-y:hidden;'>
          <div id='hiprint-printTemplate' class='hiprint-printTemplate' style='margin-top:20px;'>
          </div>
        </div>
      </div>
    )
  }

  async updatePreview (printData: PrintDataType) {
    let html = '没有数据'
    if (printData) {
      this.currPrintData = printData
      try {
        let template = printData.template
        this.hiprintTemplate = new hiprint.PrintTemplate({ template })
        let data = printData.data
        html = this.hiprintTemplate.getHtml(data)
      } catch (e) {
        html = e.message
      }
    }
    $('#printPreview').html(html)
  }

  protected renderPreview () {
    return (
      <div>
        <Button type='primary' on-click={() => { this.print() }}>打印</Button>
        <div class={this.getStyleName('preview-label')}>
          {this.printData.length > 1 && this.printData.map(ele => {
            return (
              <Button on-click={() => {
                this.updatePreview(ele)
              }}>{ele.label || '未命名'}</Button>
            )
          })}
        </div>
        <div id='printPreview'></div>
      </div>
    )
  }
}
