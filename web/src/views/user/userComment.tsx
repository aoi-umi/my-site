
import { Component, Prop, Vue } from '@/components/decorator'
import { testApi } from '@/api'
import { Input } from '@/components/iview'
import { MyList, ResultType } from '@/components/my-list'
import { convert } from '@/helpers'

import { Base } from '../base'
import { Comment, CommentDetail } from '../content/comment'

/**
 * 用户评论列表
 */

class UserCommentProp {
  @Prop()
  isReply?: boolean;
}
@Component({
  extends: Base,
  props: UserCommentProp
})
export class UserCommentList extends Vue<UserCommentProp, Base> {
  $refs: {
    list: MyList<any>,
  };
  anyKey = '';
  query() {
    this.$refs.list.handleQuery({ resetPage: true })
  }

  private async queryData(opt) {
    opt = {
      ...opt,
      anyKey: this.anyKey
    }
    await this.$refs.list.query(opt)
  }

  render() {
    return (
      <div>
        <Input v-model={this.anyKey} search on-on-search={() => {
          this.query()
        }} />
        <MyList
          ref='list'
          type='custom'
          hideSearchBox
          pagePosition="both"
          on-query={(t) => {
            this.queryData(convert.Test.listModelToQuery(t))
          }}

          queryFn={async (data) => {
            const rs = await testApi.userCommentQuery({
              ...data,
              isReply: this.isReply
            })
            return rs
          }}

          customRenderFn={(rs) => {
            return this.renderFn(rs)
          }}
        />
      </div>
    )
  }

  private renderFn(rs: ResultType) {
    return rs.data.map(ele => {
      return (
        <CommentDetail value={ele} queryByUser>
        </CommentDetail>
      )
    })
  }
}