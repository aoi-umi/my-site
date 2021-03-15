import { Component, Vue, Watch } from 'vue-property-decorator'

import { testApi } from '@/api'
import { convert } from '@/helpers'
import { MyList, IMyList } from '@/components/my-list'
import { ListBase } from '../comps/list-base'
import { Card, Input } from '@/components/iview'
import { VideoListItemView } from './video'
import { myEnum } from '@/config'
import { ArticleListItemView } from './article'
import { ContentMixItemView } from './content-mix'

@Component({
  extends: ListBase
})
export default class ViewHistory extends Vue<ListBase> {
    stylePrefix = 'view-history-';
    $refs: { list: IMyList<any> };

    anyKey = '';
    query () {
      const list = this.$refs.list
      let query
      if (!this.notQueryOnRoute) {
        query = this.$route.query
      } else {
        query = {}
      }
      convert.Test.queryToListModel(query, list.model)
      this.$refs.list.query(query)
    }

    render () {
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
              return rs.data.map(ele => {
                return <ContentMixItemView value={ele} />
              })
            }}

            queryFn={async (data) => {
              const rs = await testApi.viewHistoryQuery({ ...data, ...this.queryOpt })
              return rs
            }}

            on-query={(model, noClear, list: IMyList<any>) => {
              const q = {
                ...model.query,
                anyKey: this.anyKey,
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
            }} />
        </div>
      )
    }
}
