import { Component, Vue, Watch } from 'vue-property-decorator'

import { Prop } from '@/components/property-decorator'
import { DynamicCompConfigType, DynamicComp, DynamicCompProp } from '../my-dynamic-comp'

import {
  Table, Page, Row, Col,
  Input, Button, Divider, Card, Icon, Spin
} from '../iview'
import { Utils, getCompOpts, convClass } from '../utils'
import { MyBase } from '../my-base'
import * as style from '../style'
import { MyListModel, MyListResult } from './model'

import './style.less'

type QueryArgsType = {
  [key: string]: {
    label?: string;
    placeholder?: string;
    comp?: (query, ele) => any;
  }
}

const event = {
  addClick: 'add-click',
  resetClick: 'reset-click',
  query: 'query'
}
const clsPrefix = 'my-list-'

export const Const = {
  clsActBox: clsPrefix + 'action-box'
}

export type ResultType = {
  success: boolean,
  total: number,
  msg: string,
  data: any[]
}

export type OnSortChangeOptions = { column: any, key: string, order: string };

type ColType = {
  type?: string;
  title?: string,
  key?: string,
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  align?: string;
  className?: string;
  fixed?: string;
  ellipsis?: boolean;
  tooltip?: boolean;
  render?: (h: any, params: { row: any; column: any }) => any;
  renderHeader?: (h: any, params: { column: any }) => any;
  indexMethod?: () => any;
  sortable?: boolean | 'custom';
  sortMethod?: () => any;
  sortType?: 'asc' | 'desc';

  // 自定义字段
  hide?: boolean;
};

class MyListProp<QueryArgs = any> {
  @Prop({
    default: () => new MyListModel<{ [k in keyof QueryArgs]: any }>()
  })
  value?: MyListModel<{ [k in keyof QueryArgs]: any }>;

  @Prop({
    default: 'table'
  })
  type?: 'table' | 'custom';

  @Prop()
  columns?: ColType[];

  @Prop()
  colConfigs?: DynamicCompConfigType[];

  @Prop()
  dynamicCompOptions?: Partial<DynamicCompProp>

  @Prop()
  defaultColumn?: ColType;

  @Prop()
  customRenderFn?: (result: ResultType) => any;

  @Prop({
    default: true
  })
  defaultCustomFail?: boolean;

  @Prop({
    default: '空空的'
  })
  defaultCustomNoDataMsg?: string;

  @Prop()
  data?: any[];

  @Prop()
  queryArgs?: QueryArgs;

  @Prop()
  customQueryNode?: any;

  @Prop()
  hideQueryBtn?: {
    all?: boolean;
    add?: boolean;
    reset?: boolean;
    query?: boolean;
  };

  @Prop()
  hideSearchBox?: boolean;

  @Prop()
  hidePage?: boolean;

  @Prop({
    default: true
  })
  showSizer?: boolean;

  // 下拉刷新
  @Prop()
  infiniteScroll?: boolean;

  @Prop()
  customOperateView?: any;

  @Prop()
  queryFn?: (data: any) => MyListResult | Promise<MyListResult>;

  // 批量操作
  @Prop({ default: () => [] })
  multiOperateBtnList?: { text: string; onClick: (selection: any[]) => void }[];

  @Prop({
    default: 'bottom'
  })
  pagePosition?: 'top' | 'bottom' | 'both';

  @Prop()
  tableHeight?: string | number
}
@Component({
  extends: MyBase,
  mixins: [getCompOpts(MyListProp)]
})
class MyList<QueryArgs extends QueryArgsType> extends Vue<MyListProp<QueryArgs> & MyBase> {
  stylePrefix = clsPrefix;

  private cols?: ColType[];
  protected created () {
    if (this.type == 'table') {
      if (!this.columns && !this.colConfigs) { throw new Error(`type 'table' require 'columns' or 'colConfigs'!`) }
      this.cols = []
      if (this.colConfigs) {
        this.cols.push(...this.colConfigs.map(ele => {
          return {
            key: ele.name,
            title: ele.text || ele.name,
            align: 'center',
            render: (h, params) => {
              return (<DynamicComp props={this.dynamicCompOptions} config={ele} data={params.row}
              ></DynamicComp>)
            }
          }
        }))
      }
      if (this.columns) { this.cols.push(...this.columns) }
      let defaultColumn = {
        ...this.defaultColumn
      }
      this.cols.forEach(ele => {
        for (const key in defaultColumn) {
          if (!(key in ele)) { ele[key] = defaultColumn[key] }
        }
      })
    } else if (this.type == 'custom' && !this.customRenderFn) {
      throw new Error(`type 'custom' require 'customRenderFn'!`)
    }
    if (this.data) {
      this.result.data = this.data
      this.result.total = this.data.length
    } else {
      this.result.msg = '暂无数据'
    }

    window.addEventListener('scroll', this.handleScrollEnd)
  }

  protected beforeDestroy () {
    window.removeEventListener('scroll', this.handleScrollEnd)
  }

  private handleScrollEnd () {
    if (this.infiniteScroll && Utils.isScrollEnd()) {
      this.scrollEndHandler()
    }
  }

  private scrollEndHandler () {
    if (!this.loadedLastPage && !this.loading) {
      this.handleQuery({ noClear: true })
    }
  }
  public query (data?: any, noClear?: boolean) {
    return this._handleQuery(data, noClear)
  }
  private async _handleQuery (data?: any, noClear?: boolean) {
    this.loading = true
    try {
      this.selectedRows = []
      this.result.success = true
      if (!noClear) { this.result.data = [] }
      this.result.total = 0
      this.result.msg = '加载中'
      const rs = this.queryFn && await this.queryFn(data)
      this.result.msg = ''
      if (rs) {
        if (this.infiniteScroll) { this.result.data = [...this.result.data, ...rs.rows] } else { this.result.data = rs.rows }
        this.result.total = rs.total
      }
      const lastPage = Math.ceil(this.result.total / this.model.page.size)
      this.loadedLastPage = this.model.page.index >= lastPage
      if (!this.result.data.length) { this.result.msg = '暂无数据' } else if (this.loadedLastPage) { this.result.msg = '无更多数据' }
      if (this.infiniteScroll && !this.loadedLastPage) {
        this.model.page.index++
      }
    } catch (e) {
      this.result.success = false
      this.result.msg = e.message
      if (this.infiniteScroll) { this.$Message.error(this.result.msg) }
    } finally {
      this.loading = false
    }
  }

  handleQuery (opt?: {
    noClear?: boolean;
    resetPage?: boolean;
  }) {
    opt = {
      ...opt
    };
    // 防止使用router的时候页面不跳转
    (this.model.query as any)._t = Date.now()
    if (opt.resetPage) { this.model.page.index = 1 }
    this.$emit('query', this.model, opt.noClear, this)
  }

  private handlePress (e) {
    if (e.charCode == 13) {
      this.handleQuery({ resetPage: true })
    }
  }

  get selectedRows () {
    return this.model.selection
  }
  set selectedRows (val) {
    this.model.selection = val
  }
  private selectionChangeHandler (selection) {
    this.selectedRows = selection
  }

  private currentChangeHandler (_currentRow, _oldCurrentRow) {
    let currentRow = this.findOriginData(_currentRow)
    let oldCurrentRow = this.findOriginData(_oldCurrentRow)

    this.$emit('current-change', {
      currentRow,
      oldCurrentRow
    })
  }

  private findOriginData (row) {
    if (this.data && row) { return this.data.find(ele => ele._index === row._index) }
  }

  private showQuery = true;
  private loading = false;
  model = this.value;

  @Watch('value')
  private watchValue (newVal) {
    this.model = newVal
  }

  @Watch('data')
  private watchData (newVal) {
    if (newVal) {
      newVal.forEach((ele, idx) => {
        ele._index = idx
      })
    }
  }

  setQueryByKey (data, keyList: string[]) {
    keyList.forEach(key => {
      if (data[key]) { this.$set(this.model.query, key, data[key]) }
    })
  }
  setModel (data, opt: {
    queryKeyList?: string[];
    toListModel?: (data, model: MyListModel) => any;
  }) {
    if (opt.queryKeyList) {
      this.setQueryByKey(data, opt.queryKeyList)
    }
    if (opt.toListModel) {
      opt.toListModel(data, this.model)
    }
  }

  result: ResultType = {
    success: true,
    total: 0,
    msg: '',
    data: []
  };
  loadedLastPage = false;

  private get bottomBarClass () {
    const cls = this.getStyleName('bottom-bar')
    if (this.multiOperateBtnList.length && this.selectedRows.length) {
      cls.push('active')
    }
    return cls
  }

  private resetQueryArgs () {
    if (this.queryArgs) {
      for (const key in this.queryArgs) {
        this.$set(this.model.query, key, '')
      }
    }
  }

  $refs: { page: iView.Page & { currentPage: number } };

  private _customRenderFn (rs: ResultType) {
    let defaultFail
    if (!rs.success || !rs.data.length) {
      const msg = !rs.success ? rs.msg : this.defaultCustomNoDataMsg
      defaultFail = (
        <Card class='not-important' style={{ marginTop: '5px', textAlign: 'center' }}>{msg}</Card>
      )
    }
    return (
      <div>
        {this.defaultCustomFail && defaultFail}
        {this.customRenderFn(rs)}
      </div>
    )
  }

  private renderPage (position: string) {
    if (!this.infiniteScroll && !this.hidePage && this.result.total !== 0 && (['both', position].includes(this.pagePosition))) {
      return (
        <Page
          ref='page'
          class={this.getStyleName('page')} total={this.result.total}
          placement='top'
          current={this.model.page.index}
          page-size={this.model.page.size}
          size='small'
          show-total show-elevator show-sizer={this.showSizer}
          on-on-change={(page) => {
            this.model.page.index = page
            this.handleQuery()
          }}
          on-on-page-size-change={(size) => {
            const oldIdx = this.model.page.index
            this.model.page.index = 1
            this.model.page.size = size
            if (oldIdx == 1) {
              this.handleQuery()
            }
          }} />)
    }
  }
  protected render () {
    const hideQueryBtn = this.hideQueryBtn || {}
    if (this.$refs.page && this.$refs.page.currentPage !== this.model.page.index) {
      this.$refs.page.currentPage = this.model.page.index
    }
    return (
      <div>
        {!this.hideSearchBox &&
          <Card>
            <div class={this.getStyleName('toggle-box')}>
              <div class={style.cls.pointer} onClick={() => { this.showQuery = !this.showQuery }}>
                {this.showQuery ? '隐藏' : '展开'}筛选
                <Icon type={this.showQuery ? 'ios-arrow-up' : 'ios-arrow-down'} />
              </div>
            </div>
            <div class={this.getStyleName('query-args-box').concat(this.showQuery ? '' : 'collapsed')} on-keypress={this.handlePress}>
              <Row gutter={5}>
                {this.queryArgs && Object.entries(this.queryArgs).map(entry => {
                  const key = entry[0]
                  const ele = entry[1]
                  return (
                    <Col class={this.getStyleName('query-args-item')} xs={24} sm={8} md={6}>
                      {ele.label || key}
                      {ele.comp ? ele.comp(this.model.query, ele) : <Input placeholder={ele.placeholder} v-model={this.model.query[key]} clearable />}
                    </Col>
                  )
                })}
              </Row>
              {this.customQueryNode}
              <Divider size='small' />
              <Row gutter={5} type='flex' justify='end'>
                {[{
                  name: 'reset',
                  text: '重置',
                  click: () => {
                    this.resetQueryArgs()
                    this.$emit(event.resetClick)
                  }
                }, {
                  name: 'query',
                  text: '查询',
                  type: 'primary',
                  click: () => {
                    this.handleQuery({ resetPage: true })
                  },
                  loading: () => {
                    return this.loading
                  }
                }, {
                  name: 'add',
                  text: '新增',
                  click: () => {
                    this.$emit(event.addClick)
                  }
                }].filter(ele => !hideQueryBtn.all && !hideQueryBtn[ele.name]).map(ele => {
                  return (
                    <Col>
                      <Button type={ele.type as any} loading={ele.loading && ele.loading()} on-click={() => {
                        ele.click()
                      }}>{ele.text}</Button>
                    </Col>
                  )
                })}
                {this.customOperateView}
              </Row>
            </div>
          </Card>
        }
        <div class={this.getStyleName('content')}>
          {this.$slots.default}
          {this.renderPage('top')}
          {this.type == 'table'
            ? <Table
              class={this.getStyleName('table')} columns={this.cols.filter(ele => {
                const sort = this.model.sort
                ele.sortType = '' as any
                if (sort.orderBy && sort.sortOrder) {
                  if (ele.key == sort.orderBy) {
                    ele.sortType = sort.sortOrder as any
                  }
                }
                return !ele.hide
              })}

              data={this.result.data} no-data-text={this.result.msg}
              on-on-selection-change={this.selectionChangeHandler}
              on-on-sort-change={(opt: OnSortChangeOptions) => {
                const sortMap = {
                  asc: 1,
                  desc: -1
                }
                let orderBy; const sortOrder = sortMap[opt.order]
                if (sortOrder) { orderBy = opt.key }
                this.model.setSort({
                  orderBy,
                  sortOrder
                })
                this.handleQuery({ resetPage: true })
              }}
              height={this.tableHeight}
              highlight-row
              on-on-current-change={this.currentChangeHandler}
            >
            </Table>
            : this._customRenderFn(this.result)
          }
          {this.renderPage('bottom')}
          {!this.infiniteScroll
            ? this.loading && <Spin size='large' fix />
            : <div class={this.getStyleName('bottom-loading').concat(style.cls.center)}>
              {this.loading && <Spin size='large' fix />}
              <Divider class={this.getStyleName('bottom-loading-msg')} size='small'>
                <span>{this.result.msg}</span>
                {!this.loadedLastPage && !this.loading && <a on-click={() => {
                  this.scrollEndHandler()
                }}>{!this.result.success ? '重试' : '更多'}</a>}
              </Divider>
            </div>
          }
        </div>
        {this.multiOperateBtnList.length > 0 &&
          <Card class={this.bottomBarClass}>
            {this.multiOperateBtnList.map(ele => {
              return (
                <Button on-click={() => { ele.onClick && ele.onClick(this.selectedRows) }}>{ele.text}</Button>
              )
            })}
          </Card>}
      </div>
    )
  }
}

export interface IMyList<T extends QueryArgsType = any> extends MyList<T> { }
const MyListView = convClass<MyListProp>(MyList)
export default MyListView
