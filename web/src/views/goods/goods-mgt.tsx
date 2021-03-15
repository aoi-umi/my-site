import { Component, Vue, Watch } from 'vue-property-decorator'

import { convert } from '@/helpers'
import * as helpers from '@/helpers'
import { dev, myEnum, authority } from '@/config'
import { testApi } from '@/api'
import { routerConfig } from '@/router'
import { Modal } from '@/components/iview'
import { MyList, IMyList, Const as MyListConst } from '@/components/my-list'
import { TagType, MyTag } from '@/components/my-tag'
import { MyConfirm } from '@/components/my-confirm'

import { Base } from '../base'

@Component
export default class GoodsMgt extends Base {
    stylePrefix = 'goods-mgt-';
    $refs: { list: IMyList<any> };

    delShow = false;
    statusList: TagType[] = [];

    protected created () {
      this.statusList = convert.ViewModel.enumToTagArray(myEnum.goodsStatus)
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
      const status = query.status as string
      const statusList = status ? status.split(',') : []
      this.statusList.forEach(ele => {
        ele.checked = statusList.includes(ele.key.toString())
      })
      list.setModel(query, {
        queryKeyList: ['name'],
        toListModel: convert.Test.queryToListModel
      })
      this.$refs.list.query(query)
    }

    delIds = [];
    async delClick () {
      await this.operateHandler('删除', async () => {
        await testApi.goodsMgtDel({ idList: this.delIds })
        this.delIds = []
        this.delShow = false
        this.query()
      })
    }

    private toEdit (data?) {
      this.$router.push({
        path: routerConfig.goodsMgtEdit.path,
        query: data
      })
    }

    render () {
      return (
        <div>
          <Modal v-model={this.delShow} footer-hide>
            <MyConfirm title='确认删除?' loading={true}
              cancel={() => {
                this.delShow = false
              }}
              ok={async () => {
                await this.delClick()
              }}>
                        将要删除{this.delIds.length}项
            </MyConfirm>
          </Modal>
          <MyList
            ref='list'
            queryArgs={{
              name: {
                label: '名字'
              }
            }}

            defaultColumn={{
              minWidth: 120
            }}

            columns={[{
              key: '_selection',
              type: 'selection',
              width: 60,
              align: 'center'
            }, {
              title: '名字',
              key: 'name'
            }, {
              title: '简介',
              key: 'profile'
            }, {
              title: '状态',
              key: 'statusText'
            }, {
              title: '销量',
              key: 'saleQuantity',
              sortable: 'custom' as any
            }, {
              title: '上架时间',
              key: 'putOnAt',
              sortable: 'custom' as any,
              render: (h, params) => {
                return (
                  <span>{this.$utils.dateFormat(params.row.putOnAt)}</span>
                )
              }
            }, {
              title: '操作',
              key: 'action',
              fixed: 'right',
              width: 120,
              render: (h, params) => {
                const detail = params.row
                return (
                  <div class={MyListConst.clsActBox}>
                    <a on-click={() => {
                      this.$router.push({
                        path: routerConfig.goodsMgtDetail.path,
                        query: { _id: detail._id }
                      })
                    }}>预览</a>
                    {detail.canUpdate && <a on-click={() => {
                      this.toEdit({ _id: detail._id })
                    }}>编辑</a>}
                    {detail.canDel && <a on-click={() => {
                      this.delIds = [detail._id]
                      this.delShow = true
                    }}>删除</a>}
                  </div>
                )
              }
            }]}
            customQueryNode={<MyTag v-model={this.statusList} />}

            queryFn={async (data) => {
              const rs = await testApi.goodsMgtQuery(data)
              rs.rows.forEach(ele => {
                ele._disabled = !ele.canDel
              })
              return rs
            }}

            on-add-click={() => {
              this.toEdit()
            }}

            on-reset-click={() => {
              this.statusList.forEach(ele => {
                ele.checked = false
              })
            }}

            on-query={(model) => {
              const q = { ...model.query }
              this.$router.push({
                path: this.$route.path,
                query: {
                  ...q,
                  status: this.statusList.filter(ele => ele.checked).map(ele => ele.key).join(','),
                  ...convert.Test.listModelToQuery(model)
                }
              })
            }}

            multiOperateBtnList={[{
              text: '批量删除',
              onClick: (selection) => {
                this.delIds = selection.map(ele => ele._id)
                this.delShow = true
              }
            }]}
          ></MyList>
        </div>
      )
    }
}
