import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop } from '@/components/decorator'
import { convert } from '@/helpers'
import { testApi } from '@/api'
import { Modal, Input, Col, Card, Row, Divider } from '@/components/iview'
import { MyList, Const as MyListConst, ResultType } from '@/components/my-list'
import { MyImg } from '@/components/my-img'

import { Base } from '../base'
import { SpuType } from './goods-mgt-detail'

import './goods.less'
import { routerConfig } from '@/router'

@Component
export default class Goods extends Base {
  stylePrefix = 'goods-'
  $refs: { list: MyList<any> }

  mounted() {
    this.query()
  }

  @Watch('$route')
  route(to, from) {
    this.query()
  }

  anyKey = ''
  query() {
    const list = this.$refs.list
    const query: any = this.$route.query
    list.setModel(query, {
      queryKeyList: ['anykey'],
      toListModel: convert.Test.queryToListModel,
    })
    this.anyKey = query.anyKey
    this.$refs.list.query(query)
  }

  render() {
    return (
      <div>
        <Input
          v-model={this.anyKey}
          search
          on-on-search={() => {
            this.$refs.list.handleQuery({ resetPage: true })
          }}
        />
        <MyList
          ref="list"
          hideSearchBox
          type="custom"
          customRenderFn={this.renderResult}
          queryFn={async (data) => {
            const rs = await testApi.goodsQuery(data)
            return rs
          }}
          on-query={(model) => {
            this.goToPage({
              path: this.$route.path,
              query: {
                ...model.query,
                anyKey: this.anyKey,
                ...convert.Test.listModelToQuery(model),
              },
            })
          }}
        ></MyList>
      </div>
    )
  }

  private renderResult(rs: ResultType) {
    return (
      <Row gutter={10}>
        {rs.data.map((ele) => {
          return this.renderItem(ele)
        })}
      </Row>
    )
  }

  private renderItem(ele: SpuType) {
    return (
      <Col xs={12} sm={8} md={6} lg={5} xl={4}>
        <router-link
          class={this.getStyleName('item')}
          to={this.$utils.getUrl({
            path: routerConfig.goodsDetail.path,
            query: {
              _id: ele._id,
            },
          })}
        >
          <Card>
            <MyImg class={this.getStyleName('cover')} src={ele.imgUrls[0]} />
            <Divider />
            <div class={this.getStyleName('info')}>
              <p title={ele.name} class={this.getStyleName('name')}>
                {ele.name}
              </p>
              <div class={this.getStyleName('sale-box')}>
                <span class={[...this.getStyleName('price'), 'flex-stretch']}>
                  ¥{ele.price}
                </span>
                <span class="not-important">已售{ele.saleQuantity}</span>
              </div>
            </div>
          </Card>
        </router-link>
      </Col>
    )
  }
}
