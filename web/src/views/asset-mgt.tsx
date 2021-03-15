import { Component, Vue, Watch } from 'vue-property-decorator'

import { Prop } from '@/components/property-decorator'

import { convert } from '@/helpers'
import { dev, myEnum, authority } from '@/config'
import { routerConfig } from '@/router'
import { testApi, testSocket } from '@/api'
import { Modal, Input, Button, Card, Row, Col, Checkbox, Tabs, TabPane } from '@/components/iview'
import { MyList, IMyList, Const as MyListConst } from '@/components/my-list'
import { TagType, MyTag } from '@/components/my-tag'
import { Base } from './base'

@Component
export class AssetMgtLog extends Base {
    $refs: { list: IMyList<any> };
    protected created () {
      this.statusList = convert.ViewModel.enumToTagArray(myEnum.assetLogStatus)
    }

    mounted () {
      this.query()
    }

    @Watch('$route')
    route (to, from) {
      this.query()
    }

    query () {
      const list = this.$refs.list
      const query = this.$route.query
      list.setQueryByKey(query, ['orderNo', 'outOrderNo'])
      const status = this.$route.query.status as string
      const statusList = status ? status.split(',') : []
      this.statusList.forEach(ele => {
        ele.checked = statusList.includes(ele.key.toString())
      })
      convert.Test.queryToListModel(query, list.model)
      this.$refs.list.query(query)
    }

    statusList: TagType[] = [];

    render () {
      return (
        <MyList
          ref='list'
          queryArgs={{
            orderNo: {
              label: '订单号'
            },
            outOrderNo: {
              label: '外部订单号'
            }
          }}
          hideQueryBtn={{
            add: true
          }}

          customQueryNode={<MyTag v-model={this.statusList} />}

          defaultColumn={{
            minWidth: 120
          }}
          columns={[{
            title: '订单号',
            key: 'orderNo',
            render: (h, params) => {
              const detail = params.row
              return <a on-click={() => {
                this.$router.push({
                  path: routerConfig.assetMgtNotify.path,
                  query: { orderNo: detail.orderNo }
                })
              }}>{detail.orderNo}</a>
            }
          }, {
            title: '外部订单号',
            key: 'outOrderNo',
            render: (h, params) => {
              const detail = params.row
              return <a on-click={() => {
                this.$router.push({
                  path: routerConfig.assetMgtNotify.path,
                  query: { outOrderNo: detail.outOrderNo }
                })
              }}>{detail.outOrderNo}</a>
            }
          }, {
            title: '金额',
            key: 'money'
          }, {
            title: '支付方式',
            key: 'sourceTypeText'
          }, {
            title: '类型',
            key: 'typeText'
          }, {
            title: '状态',
            key: 'statusText'
          }, {
            title: '通知id',
            key: 'notifyId'
          }, {
            title: '备注',
            key: 'remark'
          }, {
            title: '创建时间',
            key: 'createdAt',
            render: (h, params) => {
              return <span>{this.$utils.dateFormat(params.row.createdAt)}</span>
            }
          }]}

          queryFn={async (data) => {
            const rs = await testApi.assetLogQuery(data)
            return rs
          }}

          on-query={(model) => {
            this.$router.push({
              path: this.$route.path,
              query: {
                ...model.query,
                status: this.statusList.filter(ele => ele.checked).map(ele => ele.key).join(','),
                ...convert.Test.listModelToQuery(model)
              }
            })
          }}

        />
      )
    }
}

@Component
export class AssetMgtNotify extends Base {
    $refs: { list: IMyList<any> };
    protected created () {
    }

    mounted () {
      this.query()
    }

    @Watch('$route')
    route (to, from) {
      this.query()
    }

    query () {
      const list = this.$refs.list
      const query = this.$route.query
      list.setQueryByKey(query, ['orderNo', 'outOrderNo'])
      const status = this.$route.query.status as string
      convert.Test.queryToListModel(query, list.model)
      this.$refs.list.query(query)
    }

    render () {
      return (
        <MyList
          ref='list'
          queryArgs={{
            orderNo: {
              label: '订单号'
            },
            outOrderNo: {
              label: '外部订单号'
            }
          }}
          hideQueryBtn={{
            add: true
          }}

          columns={[{
            key: '_expand',
            type: 'expand',
            width: 30,
            render: (h, params) => {
              const detail = params.row
              return (
                <Tabs>
                  <TabPane label='通知'>
                    <pre>{JSON.stringify(detail.value, null, '\t')}</pre>
                  </TabPane>
                  <TabPane label='原通知'>
                    <div style={{ wordWrap: 'break-word' }}>{JSON.stringify(detail.raw)}</div>
                  </TabPane>
                </Tabs>
              )
            }
          }, {
            title: '订单号',
            key: 'orderNo',
            render: (h, params) => {
              const detail = params.row
              return <a on-click={() => {
                this.$router.push({
                  path: routerConfig.assetMgtLog.path,
                  query: { orderNo: detail.orderNo }
                })
              }}>{detail.orderNo}</a>
            }
          }, {
            title: '外部订单号',
            key: 'outOrderNo'
          }, {
            title: '类型',
            key: 'typeText'
          }, {
            title: '资金记录状态',
            key: 'assetLogStatus',
            render: (h, params) => {
              const detail = params.row
              return (
                !!detail.assetLog &&
                            <div>
                              <span>{detail.assetLog.statusText}</span>
                              {myEnum.assetLogStatus.未完成 === detail.assetLog.status &&
                                    this.storeUser.user.hasAuth(authority.payMgtOperate) &&
                                    <a on-click={() => {
                                      this.operateHandler('重试', async () => {
                                        await testApi.assetNotifyRetry({ _id: detail._id })
                                        detail.assetLog.status = myEnum.assetLogStatus.已完成
                                      })
                                    }}>重试</a>}
                            </div>
              )
            }
          }, {
            title: '创建时间',
            key: 'createdAt',
            render: (h, params) => {
              return <span>{this.$utils.dateFormat(params.row.createdAt)}</span>
            }
          }]}

          queryFn={async (data) => {
            const rs = await testApi.assetNotifyQuery(data)
            return rs
          }}

          on-query={(model) => {
            this.$router.push({
              path: this.$route.path,
              query: {
                ...model.query,
                ...convert.Test.listModelToQuery(model)
              }
            })
          }}

        />
      )
    }
}
