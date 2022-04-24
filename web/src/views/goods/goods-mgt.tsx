import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop } from '@/components/decorator'
import { convert } from '@/helpers'
import { dev, myEnum, authority } from '@/config'
import { testApi } from '@/api'
import { routerConfig } from '@/router'
import { MyList, Const as MyListConst } from '@/components/my-list'
import { TagType, MyTag } from '@/components/my-tag'

import { Base } from '../base'

@Component
export default class GoodsMgt extends Base {
  stylePrefix = 'goods-mgt-'
  $refs: { list: MyList<any> }

  statusList: TagType[] = []

  protected created() {
    this.statusList = convert.ViewModel.enumToTagArray(myEnum.goodsStatus)
  }

  mounted() {
    this.query()
  }

  @Watch('$route')
  route(to, from) {
    this.query()
  }

  query() {
    const list = this.$refs.list
    const query = this.$route.query
    const status = query.status as string
    const statusList = status ? status.split(',') : []
    this.statusList.forEach((ele) => {
      ele.checked = statusList.includes(ele.key.toString())
    })
    list.setModel(query, {
      queryKeyList: ['name'],
      toListModel: convert.Test.queryToListModel,
    })
    this.$refs.list.query(query)
  }

  delIds = []
  delConfirm() {
    this.$utils.confirm(`将要删除${this.delIds.length}项`, {
      ok: this.delClick,
    })
  }

  async delClick() {
    return await this.operateHandler('删除', async () => {
      await testApi.goodsMgtDel({ idList: this.delIds })
      this.delIds = []
      this.query()
    })
  }

  private getEditUrlObj(data?) {
    return {
      path: routerConfig.goodsMgtEdit.path,
      query: data,
    }
  }
  private toEdit(data?) {
    this.goToPage(this.getEditUrlObj(data))
  }

  private getOp(detail) {
    let operate = []
    operate.push({
      text: '预览',
      to: this.$utils.getUrl({
        path: routerConfig.goodsMgtDetail.path,
        query: { _id: detail._id },
      }),
    })
    if (detail.canUpdate) {
      operate.push({
        text: '编辑',
        to: this.$utils.getUrl(this.getEditUrlObj(detail)),
      })
    }
    if (detail.canDel) {
      operate.push({
        text: '删除',
        fn: () => {
          this.delIds = [detail._id]
          this.delConfirm()
        },
      })
    }
    return operate
  }

  render() {
    return (
      <div>
        <MyList
          ref="list"
          queryArgs={{
            name: {
              label: '名字',
            },
          }}
          columns={[
            {
              key: '_selection',
              type: 'selection',
              width: 60,
              align: 'center',
            },
            {
              title: '名字',
              key: 'name',
            },
            {
              title: '简介',
              key: 'profile',
            },
            {
              title: '状态',
              key: 'statusText',
            },
            {
              title: '销量',
              key: 'saleQuantity',
              sortable: 'custom' as any,
            },
            {
              title: '上架时间',
              key: 'putOnAt',
              sortable: 'custom' as any,
              render: (h, params) => {
                return <span>{this.$utils.dateFormat(params.row.putOnAt)}</span>
              },
            },
            {
              title: '操作',
              key: 'action',
              fixed: 'right',
              width: 120,
              render: (h, params) => {
                const detail = params.row
                return (
                  <div class={MyListConst.clsActBox}>
                    {this.getOp(detail).map((ele) => {
                      // TODO 封装组件
                      return ele.to ? (
                        <router-link to={ele.to}>{ele.text}</router-link>
                      ) : (
                        <a
                          on-click={() => {
                            ele.fn && ele.fn()
                          }}
                        >
                          {ele.text}
                        </a>
                      )
                    })}
                  </div>
                )
              },
            },
          ]}
          customQueryNode={<MyTag v-model={this.statusList} />}
          queryFn={async (data) => {
            const rs = await testApi.goodsMgtQuery(data)
            rs.rows.forEach((ele) => {
              ele._disabled = !ele.canDel
            })
            return rs
          }}
          on-add-click={() => {
            this.toEdit()
          }}
          on-reset-click={() => {
            this.statusList.forEach((ele) => {
              ele.checked = false
            })
          }}
          on-query={(model) => {
            const q = { ...model.query }
            this.goToPage({
              path: this.$route.path,
              query: {
                ...q,
                status: this.statusList
                  .filter((ele) => ele.checked)
                  .map((ele) => ele.key)
                  .join(','),
                ...convert.Test.listModelToQuery(model),
              },
            })
          }}
          multiOperateBtnList={[
            {
              text: '批量删除',
              onClick: (selection) => {
                this.delIds = selection.map((ele) => ele._id)
                this.delConfirm()
              },
            },
          ]}
        ></MyList>
      </div>
    )
  }
}
