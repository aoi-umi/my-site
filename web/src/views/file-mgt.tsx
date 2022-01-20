import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop, Confirm } from '@/components/decorator'

import { testApi } from '@/api'
import { convert } from '@/helpers'
import { Tag, Modal, Input, Row, Col, Form, FormItem, Button } from '@/components/iview'
import { MyList, Const as MyListConst, OnSortChangeOptions, MyListModel } from '@/components/my-list'
import { MyUpload, FileDataType } from '@/components/my-upload'
import { MyImgViewer } from '@/components/my-img-viewer'

import { Base } from './base'
import { UserAvatar } from './comps/user-avatar'

@Component
export default class FileMgt extends Base {
  detailShow = false;
  detail: any;
  $refs: { list: MyList<any>, imgViewer: MyImgViewer };

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

  private currUrl = ''

  private imgClick(row) {
    this.currUrl = row.url;
    this.$refs.imgViewer.show();
  }

  protected render() {
    return (
      <div>
        <MyImgViewer ref='imgViewer' src={this.currUrl} />
        <MyList
          ref='list'
          hideQueryBtn={{ add: true }}
          queryArgs={{
            md5: {
              label: 'hash'
            },
            anyKey: {
              label: '任意字'
            }
          }}
          selectable
          columns={[{
            title: 'hash',
            key: 'md5',
            sortable: 'custom',
            minWidth: 120
          }, {
            title: '文件',
            key: 'url',
            minWidth: 200,
            render: (h, params) => {
              return (
                params.row.url &&
                (params.row.fileType == FileDataType.图片 ?
                  <img style="width:160px; height:90px; object-fit: cover;" src={params.row.url} on-click={() => {
                    this.imgClick(params.row)
                  }} /> :
                  <a href={params.row.url}>查看</a>)

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
            const rs = await testApi.fileMgtQuery(data);
            rs.rows.forEach(ele => {
              ele._disabled = ele.isUserDel
            })
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

          multiOperateBtnList={[{
            text: '批量删除',
            onClick: (selection) => {
              this.delIds = selection.map(ele => ele._id)
              this.delHandler()
            }
          }]}

        ></MyList>
      </div>
    )
  }
}
