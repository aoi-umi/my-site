import { Component, Vue, Watch } from 'vue-property-decorator'

import { testApi } from '@/api'
import { convert } from '@/helpers'
import { MyList, IMyList, Const as MyListConst, MyListModel } from '@/components/my-list'
import { Base } from './base'
import { routerConfig } from '@/router'

@Component
export default class PrintMgt extends Base {
  $refs: { list: IMyList<any> };

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
    list.setQueryByKey(query, ['name'])
    convert.Test.queryToListModel(query, list.model)
    this.$refs.list.query(query)
  }

  async delHandler (delIds: any[]) {
    this.$utils.confirm((
      <div>
        将要删除{delIds.length}项
      </div>
    ), {
      title: '确认删除?',
      confirm: async () => {
        await testApi.printMgtDel({ idList: delIds })
        this.query()
      }
    })
  }

  toDetail (query?) {
    this.$router.push({
      path: routerConfig.printMgtDetail.path,
      query
    })
  }

  protected render () {
    return (
      <div>
        <MyList
          ref='list'
          queryArgs={{
            name: {
              label: '名字'
            }
          }}
          columns={[{
            key: '_selection',
            type: 'selection',
            width: 60,
            align: 'center'
          }, {
            title: '名字',
            key: 'name',
            sortable: 'custom',
            minWidth: 120
          }, {
            title: '操作',
            key: 'action',
            fixed: 'right',
            width: 120,
            render: (h, params) => {
              return (
                <div class={MyListConst.clsActBox}>
                  <a on-click={() => {
                    let row = params.row
                    this.toDetail({ _id: row._id })
                  }}>编辑</a>
                  <a on-click={() => {
                    this.delHandler([params.row._id])
                  }}>删除</a>
                </div>
              )
            }
          }]}

          queryFn={async (data) => {
            const rs = await testApi.printMgtQuery(data)
            return rs
          }}

          on-query={(model: MyListModel) => {
            this.$router.push({
              path: this.$route.path,
              query: {
                ...model.query,
                ...convert.Test.listModelToQuery(model)
              }
            })
          }}

          on-add-click={() => {
            this.toDetail()
          }}

          multiOperateBtnList={[{
            text: '批量删除',
            onClick: (selection) => {
              this.delHandler(selection.map(ele => ele._id))
            }
          }]}
        ></MyList>
      </div>
    )
  }
}
