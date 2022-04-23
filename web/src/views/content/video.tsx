import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop } from '@/components/decorator'
import { testApi } from '@/api'
import { myEnum, authority, dev } from '@/config'
import { convert } from '@/helpers'
import { Card, Input, Row, Col } from '@/components/iview'
import { MyList } from '@/components/my-list'

import { Base } from '../base'
import { ListBase, ListBaseProp } from '../comps/list-base'
import { DetailDataType } from './article-mgt-detail'
import { ContentListItem } from './content'

import './video.less'

class VideoProp extends ListBaseProp { }
@Component({
  extends: ListBase
})
export default class Video extends Vue<VideoProp, ListBase> {
  $refs: { list: MyList<any> };

  anyKey = '';

  query() {
    const list = this.$refs.list
    let query
    if (!this.notQueryOnRoute) {
      query = this.$route.query
      list.setQueryByKey(query, ['user', 'title'])
      this.anyKey = query.anyKey
    } else {
      query = {}
    }
    convert.Test.queryToListModel(query, list.model)
    this.$refs.list.query(query)
  }

  protected delSuccessHandler() {
    this.$refs.list.query()
  }

  protected render() {
    return (
      <div>
        <Input v-model={this.anyKey} search on-on-search={() => {
          this.$refs.list.handleQuery({ resetPage: true })
        }} />
        <MyList
          ref='list'
          hideSearchBox

          type='custom'
          customRenderFn={(rs) => {
            return (
              <Row gutter={5}>
                {rs.data.map(ele => {
                  return (
                    <Col xl={4} lg={6} md={8} xs={12}>
                      <VideoListItem value={ele} min />
                    </Col>
                  )
                })}
              </Row>)
          }}

          queryFn={async (data) => {
            const rs = await testApi.videoQuery({ ...data, ...this.queryOpt })
            return rs
          }}

          on-query={(model, noClear, list: MyList<any>) => {
            const q = {
              ...model.query,
              anyKey: this.anyKey,
              ...convert.Test.listModelToQuery(model)
            }
            if (!this.notQueryToRoute) {
              this.goToPage({
                path: this.$route.path,
                query: q
              })
            } else {
              list.query(q)
            }
          }}
        >
        </MyList>
      </div >
    )
  }
}

class VideoListItemProp {
  @Prop({
    required: true
  })
  value: DetailDataType;

  @Prop({
    default: false
  })
  selectable?: boolean;

  @Prop()
  mgt?: boolean;

  @Prop()
  min?: boolean;
}
@Component({
  extends: Base,
  props: VideoListItemProp
})
export class VideoListItem extends Vue<VideoListItemProp, Base> {
  render() {
    return (
      <ContentListItem
        value={this.value}
        selectable={this.selectable}
        mgt={this.mgt}
        min={this.min}
        contentType={myEnum.contentType.视频}
        on-selected-change={(checked) => {
          this.$emit('selected-change', checked)
        }}
      >
        {this.$slots.default}
      </ContentListItem>
    )
  }
}

