import { Component, Vue, Watch } from 'vue-property-decorator'
import { testApi } from '@/api'
import { myEnum, authority, dev } from '@/config'
import { routerConfig } from '@/router'
import { convert } from '@/helpers'
import { Card, Button } from '@/components/iview'
import { convClass, getCompOpts } from '@/components/utils'
import { MyList, IMyList } from '@/components/my-list'
import { MyTag, TagType } from '@/components/my-tag'

import { ListBase, IListBase, ListBaseProp } from '../comps/list-base'
import { DetailDataType } from './article-mgt-detail'
import { VideoListItemView } from './video'
import { ContentMgtBase, ContentDataType, IContentMgtBase } from './content-mgt-base'

@Component
export class VideoMgtBase extends ContentMgtBase implements IContentMgtBase {
    contentMgtType = myEnum.contentMgtType.视频;

    async auditFn (detail, pass) {
      const toStatus = pass ? myEnum.videoStatus.审核通过 : myEnum.videoStatus.审核不通过
      const rs = await testApi.videoMgtAudit({ idList: [detail._id], status: toStatus, remark: this.notPassRemark })
      return rs
    }

    canAudit (detail: ContentDataType) {
      return detail.status == myEnum.videoStatus.待审核 && this.storeUser.user.hasAuth(authority.videoMgtAudit)
    }

    toDetailUrl (preview) {
      return preview ? routerConfig.videoMgtDetail.path : routerConfig.videoMgtEdit.path
    }

    async delFn () {
      await testApi.videoMgtDel({ idList: this.delIds, remark: this.delRemark })
    }

    isDel (detail) {
      return detail.status === myEnum.videoStatus.已删除
    }
}

class VideoMgtProp extends ListBaseProp { }
@Component({
  extends: VideoMgtBase,
  mixins: [getCompOpts(VideoMgtProp)]
})
export default class VideoMgt extends Vue<VideoMgtProp & VideoMgtBase> implements IListBase {
    $refs: { list: IMyList<any> };

    protected created () {
      this.statusList = convert.ViewModel.enumToTagArray(myEnum.videoStatus)
    }

    mounted () {
      if (!this.notQueryOnMounted) { this.query() }
    }

    @Watch('$route')
    route (to, from) {
      if (!this.notQueryOnRoute) { this.query() }
    }

    query () {
      const list = this.$refs.list
      const query = this.$route.query
      list.setQueryByKey(query, ['user', 'title', 'anyKey'])
      const status = query.status as string
      const statusList = status ? status.split(',') : []
      this.statusList.forEach(ele => {
        ele.checked = statusList.includes(ele.key.toString())
      })
      convert.Test.queryToListModel(query, list.model)
      this.$refs.list.query(query)
    }

    statusList: TagType[] = [];

    protected delSuccessHandler () {
      this.query()
    }

    protected auditSuccessHandler (detail) {
      const data = this.$refs.list.result.data
      const idx = data.findIndex(ele => ele._id === detail._id)
      this.$refs.list.result.data.splice(idx, 1, detail)
    }

    private get multiOperateBtnList () {
      const list = []
      if (this.storeUser.user.hasAuth(authority.authorityDel)) {
        list.push({
          text: '批量删除',
          onClick: (selection) => {
            this.delIds = selection.map(ele => ele._id)
            this.delShow = true
            this.delRemark = ''
          }
        })
      }
      return list
    }

    protected render () {
      return (
        <div>
          {this.renderDelConfirm()}
          {this.renderNotPassConfirm()}
          <MyList
            ref='list'
            queryArgs={{
              user: {
                label: '用户'
              },
              title: {
                label: '标题'
              },
              anyKey: {
                label: '任意字'
              }
            }}
            customQueryNode={<MyTag v-model={this.statusList} />}

            hideQueryBtn={{
              add: !this.storeUser.user.isLogin
            }}

            type='custom'
            customRenderFn={(rs) => {
              return rs.data.map((ele: DetailDataType) => {
                ele._disabled = !ele.canDel
                return (
                  <VideoListItemView value={ele} mgt
                    selectable={!!this.multiOperateBtnList.length}
                    on-selected-change={(val) => {
                      ele._checked = val
                      this.$refs.list.selectedRows = rs.data.filter(ele => ele._checked)
                    }}>
                    {this.renderListOpBox(ele)}
                  </VideoListItemView>
                )
              })
            }}

            queryFn={async (data) => {
              const rs = await testApi.videoMgtQuery(data)
              return rs
            }}

            on-query={(model, noClear, list: IMyList<any>) => {
              const q = {
                ...model.query,
                status: this.statusList.filter(ele => ele.checked).map(ele => ele.key).join(','),
                ...convert.Test.listModelToQuery(model)
              }
              if (!this.notQueryToRoute) {
                this.$router.push({
                  path: this.$route.path,
                  query: q
                })
              } else {
                list.query(q)
              }
            }}

            on-add-click={() => {
              this.toDetail()
            }}

            on-reset-click={() => {
              this.statusList.forEach(ele => {
                ele.checked = false
              })
            }}

            multiOperateBtnList={this.multiOperateBtnList}
          >
          </MyList>
        </div>
      )
    }
}

export const VideoMgtView = convClass<VideoMgtProp>(VideoMgt)
