import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop, Confirm } from '@/components/decorator'

import { testApi } from '@/api'
import { convert } from '@/helpers'
import { Tag, Modal, Input, Row, Col, Form, FormItem, Button } from '@/components/iview'
import { MyList, Const as MyListConst, OnSortChangeOptions, MyListModel } from '@/components/my-list'
import { MyTagModel, MyTag } from '@/components/my-tag'
import { Base } from './base'
import { UserAvatar } from './comps/user-avatar'
import { MyUpload } from '@/components/my-upload'

@Component
export default class FileMgt extends Base {
  detailShow = false;
  detail: any;
  $refs: { list: MyList<any> };

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

  delIds = []
  @Confirm(function (this: FileMgt) {
    return `将要删除${this.delIds.length}项`
  }, { title: '确认删除?' })
  async delHandler() {
    this.delIds = []
    this.query()
  }

  protected render() {
    return (
      <div>
        <MyList
          ref='list'
          hideQueryBtn={{ add: true }}
          queryArgs={{
            name: {
              label: '名字'
            },
            url: {},
            anyKey: {
              label: '任意字'
            }
          }}
          columns={[{
            title: '名字',
            key: 'filename',
            sortable: 'custom',
            minWidth: 120
          }, {
            title: '文件',
            key: 'file',
            sortable: true,
            minWidth: 200,
            render: (h, params) => {
              return (
                params.row.url &&
                <MyUpload
                  readonly
                  width={160} height={90}
                  value={[{ url: params.row.url, fileType: params.row.fileType, originFileType: 'video/mp4' }]}
                ></MyUpload>
              )
            }
          }, {
            title: '上传者',
            key: 'uploader',
            fixed: 'right',
            width: 120,
            render: (h, params) => {
              return (
                <UserAvatar user={params.row.user} type="text" />
              )
            }
          }, {
            title: '操作',
            key: 'action',
            fixed: 'right',
            width: 120,
            render: (h, params) => {
              return (
                <div class={MyListConst.clsActBox}>

                </div>
              )
            }
          }]}

          queryFn={async (data) => {
            const rs = await testApi.fileMgtQuery(data)
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


        ></MyList>
      </div>
    )
  }
}
