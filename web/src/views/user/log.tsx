import {} from 'vue-property-decorator'

import { Component, Vue, Prop } from '@/components/decorator'
import { testApi } from '@/api'
import { myEnum, dev } from '@/config'
import { routerConfig } from '@/router'
import { Input, Card } from '@/components/iview'
import { MyList, ResultType } from '@/components/my-list'
import { convert } from '@/helpers'

import { Base } from '../base'

/**
 * 日志
 */
class LogListProp {
  @Prop({
    required: true,
  })
  userId: string
}

@Component({
  extends: Base,
  props: LogListProp,
})
export class LogList extends Vue<LogListProp, Base> {
  stylePrefix = 'user-log-'

  $refs: {
    list: MyList<any>
  }
  anyKey = ''

  query() {
    this.$refs.list.handleQuery({ resetPage: true })
  }

  private async queryData(opt) {
    opt = {
      ...opt,
      anyKey: this.anyKey,
      userId: this.userId,
    }

    await this.$refs.list.query(opt)
  }

  private renderFn(rs: ResultType) {
    return rs.data.map((ele) => {
      return (
        <Card class={this.getStyleName('main')}>
          <div class={this.getStyleName('content')}>
            {ele.operator}
            {ele.remark}
          </div>
        </Card>
      )
    })
  }

  render() {
    return (
      <div>
        <Input
          v-model={this.anyKey}
          search
          on-on-search={() => {
            this.query()
          }}
        />
        <MyList
          ref="list"
          type="custom"
          hideSearchBox
          on-query={(t) => {
            this.queryData(convert.Test.listModelToQuery(t))
          }}
          queryFn={async (data) => {
            const rs = await testApi.userLogQuery(data)
            return rs
          }}
          customRenderFn={(rs) => {
            return this.renderFn(rs)
          }}
        />
      </div>
    )
  }
}
