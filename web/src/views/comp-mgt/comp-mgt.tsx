import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop } from '@/components/decorator'
import { testApi } from '@/api'
import { convert } from '@/helpers'
import { MyList, Const as MyListConst, MyListModel } from '@/components/my-list'
import { routerConfig } from '@/router'

import { Base } from '../base'
import { OperateButton, OperateDataType } from '../comps/operate-button'

@Component
export default class CompMgt extends Base {
  $refs: { list: MyList<any> }

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
    list.setQueryByKey(query, ['name'])
    convert.Test.queryToListModel(query, list.model)
    this.$refs.list.query(query)
  }

  async delHandler(delIds: any[]) {
    this.$utils.confirm(<div>将要删除{delIds.length}项</div>, {
      title: '确认删除?',
      ok: async () => {
        await testApi.compMgtDel({ idList: delIds })
        this.query()
      },
    })
  }

  toDetail(query?) {
    this.goToPage({
      path: routerConfig.compMgtDetail.path,
      query,
    })
  }

  toPreview(query) {
    this.goToPage({
      path: routerConfig.compMgtPreview.path,
      query,
    })
  }

  private getOp(detail) {
    let operate: OperateDataType[] = []
    operate.push({
      text: '编辑',
      to: this.$utils.getUrl({
        path: routerConfig.compMgtDetail.path,
        query: { _id: detail._id },
      }),
    })
    operate.push({
      text: '预览',
      to: this.$utils.getUrl({
        path: routerConfig.compMgtPreview.path,
        query: { _id: detail._id },
      }),
    })
    operate.push({
      text: '删除',
      fn: () => {
        this.delHandler([detail._id])
      },
    })
    return operate
  }

  protected render() {
    return (
      <div>
        <MyList
          ref="list"
          queryArgs={{
            name: {
              label: '名字',
            },
            text: {
              label: '显示',
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
              minWidth: 120,
            },
            {
              title: '显示',
              key: 'text',
              minWidth: 120,
            },
            {
              title: '操作',
              key: 'action',
              fixed: 'right',
              width: 120,
              render: (h, params) => {
                return (
                  <div class={MyListConst.clsActBox}>
                    {this.getOp(params.row).map((ele) => (
                      <OperateButton data={ele}></OperateButton>
                    ))}
                  </div>
                )
              },
            },
          ]}
          queryFn={async (data) => {
            const rs = await testApi.compMgtQuery(data)
            return rs
          }}
          on-query={(model: MyListModel) => {
            this.goToPage({
              path: this.$route.path,
              query: {
                ...model.query,
                ...convert.Test.listModelToQuery(model),
              },
            })
          }}
          on-add-click={() => {
            this.toDetail()
          }}
          multiOperateBtnList={[
            {
              text: '批量删除',
              onClick: (selection) => {
                this.delHandler(selection.map((ele) => ele._id))
              },
            },
          ]}
        ></MyList>
      </div>
    )
  }
}
