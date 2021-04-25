import { Watch } from 'vue-property-decorator'

import { Component, Vue } from '@/components/decorator'
import { testApi } from '@/api'
import { convert } from '@/helpers'
import { MyList } from '@/components/my-list'
import { Card, Input } from '@/components/iview'

import { ListBase } from '../comps/list-base'
import { ContentMixItem } from './content-mix'

@Component({
  extends: ListBase
})
export default class ViewHistory extends Vue<{}, ListBase> {
    stylePrefix = 'view-history-';
    $refs: { list: MyList<any> };

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
                return <ContentMixItem value={ele} />
              })
            }}

            queryFn={async (data) => {
              const rs = await testApi.viewHistoryQuery({ ...data, ...this.queryOpt })
              return rs
            }}

            on-query={(model, noClear, list: MyList<any>) => {
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
