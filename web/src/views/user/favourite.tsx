
import { Component } from '@/components/decorator'
import { testApi } from '@/api'
import { Input } from '@/components/iview'
import { MyList, ResultType } from '@/components/my-list'

import { Base } from '../base'
import { ContentMixItem } from '../content/content-mix'

/**
 * 收藏
 */
@Component
export class FavouriteList extends Base {
    $refs: {
        list: MyList<any>,
    };
    anyKey = '';
    query () {
      this.$refs.list.handleQuery({ resetPage: true })
    }

    private async favouriteQuery () {
      const opt = {
        anyKey: this.anyKey
      }
      await this.$refs.list.query(opt)
    }

    render () {
      return (
        <div>
          <Input v-model={this.anyKey} search on-on-search={() => {
            this.query()
          }} />
          <MyList
            ref='list'
            type='custom'
            hideSearchBox
            on-query={(t) => {
              this.favouriteQuery()
            }}

            queryFn={async (data) => {
              const rs = await testApi.favouriteQuery(data)
              return rs
            }}

            customRenderFn={(rs) => {
              return this.renderFn(rs)
            }}
          />
        </div>
      )
    }

    private renderFn (rs: ResultType) {
      return rs.data.map(ele => {
        return <ContentMixItem value={ele} />
      })
    }
}

