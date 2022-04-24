import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop, Confirm } from '@/components/decorator'

import { testApi } from '@/api'
import { convert } from '@/helpers'
import {
  Tag,
  Modal,
  Input,
  Row,
  Col,
  Form,
  FormItem,
  Button,
  Checkbox,
} from '@/components/iview'
import {
  MyList,
  Const as MyListConst,
  OnSortChangeOptions,
  MyListModel,
} from '@/components/my-list'
import { MyUpload, FileDataType } from '@/components/my-upload'
import { MyImgViewer } from '@/components/my-img-viewer'

import { Base } from './base'
import { UserAvatar } from './comps/user-avatar'

@Component
export default class FileMgt extends Base {
  detailShow = false
  detail: any
  $refs: { list: MyList<any>; imgViewer: MyImgViewer }

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
    list.setQueryByKey(query, ['name', 'url', 'anyKey'])
    convert.Test.queryToListModel(query, list.model)
    this.$refs.list.query(query)
  }

  operateIds = []
  @Confirm(
    function (this: FileMgt) {
      return `将要删除${this.operateIds.length}项`
    },
    { title: '确认删除?' },
  )
  async delHandler() {
    await this.operateHandler('删除', async () => {
      await testApi.fileMgtDel({ idList: this.operateIds })
      this.operateIds = []
      this.query()
    })
  }

  @Confirm(
    function (this: FileMgt) {
      return `将要恢复${this.operateIds.length}项`
    },
    { title: '确认恢复?' },
  )
  async recoveryHandler() {
    await this.operateHandler('恢复', async () => {
      await testApi.fileMgtRecovery({ idList: this.operateIds })
      this.operateIds = []
      this.query()
    })
  }

  private currUrl = ''

  private imgClick(row) {
    this.currUrl = row.url
    this.$refs.imgViewer.show()
  }

  protected render() {
    return (
      <div>
        <MyImgViewer ref="imgViewer" src={this.currUrl} />
        <MyList
          ref="list"
          hideQueryBtn={{ add: true }}
          queryArgs={{
            md5: {
              label: 'hash',
            },
            anyKey: {
              label: '任意字',
            },
          }}
          selectable
          columns={[
            {
              title: 'hash',
              key: 'md5',
              sortable: 'custom',
              minWidth: 120,
            },
            {
              title: '文件',
              key: 'url',
              minWidth: 200,
              render: (h, params) => {
                return (
                  params.row.url &&
                  (params.row.fileType == FileDataType.图片 ? (
                    <img
                      style="width:160px; height:90px; object-fit: cover;"
                      src={params.row.url}
                      on-click={() => {
                        this.imgClick(params.row)
                      }}
                    />
                  ) : (
                    <a href={params.row.url}>查看</a>
                  ))
                )
              },
            },
            {
              title: '已删除',
              key: 'isDel',
              minWidth: 120,
              render: (h, params) => {
                return <Checkbox disabled value={params.row.isDel}></Checkbox>
              },
            },
            {
              title: '操作',
              key: 'action',
              fixed: 'right',
              width: 120,
              render: (h, params) => {
                return <div class={MyListConst.clsActBox}></div>
              },
            },
          ]}
          queryFn={async (data) => {
            const rs = await testApi.fileMgtQuery(data)
            rs.rows.forEach((ele) => {
              ele._disabled = ele.isUserDel
            })
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
          multiOperateBtnList={[
            {
              text: '删除',
              onClick: (selection) => {
                this.operateIds = selection.map((ele) => ele._id)
                this.delHandler()
              },
            },
            {
              text: '恢复',
              onClick: (selection) => {
                this.operateIds = selection.map((ele) => ele._id)
                this.recoveryHandler()
              },
            },
          ]}
        ></MyList>
      </div>
    )
  }
}
