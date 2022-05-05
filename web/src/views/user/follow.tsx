import {} from 'vue-property-decorator'

import { Component, Vue, Prop } from '@/components/decorator'
import { testApi } from '@/api'
import { myEnum, dev } from '@/config'
import { routerConfig } from '@/router'
import { Input, Card } from '@/components/iview'
import { MyList, ResultType } from '@/components/my-list'
import { convert } from '@/helpers'

import { UserAvatar } from '../comps/user-avatar'
import { FollowButton } from '../comps/follow-button'
import { Base } from '../base'

/**
 * 粉丝/关注
 */
class FollowListProp {
  @Prop({
    required: true,
  })
  userId: string

  @Prop({
    required: true,
  })
  followType: number
}

@Component({
  extends: Base,
  props: FollowListProp,
})
export class FollowList extends Vue<FollowListProp, Base> {
  stylePrefix = 'user-follow-'

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
      type: this.followType,
    }

    await this.$refs.list.query(opt)
  }

  private renderFn(rs: ResultType) {
    return rs.data.map((ele) => {
      const user =
        this.followType == myEnum.followQueryType.粉丝
          ? ele.followerUser
          : ele.followingUser
      return (
        <Card class={[...this.getStyleName('main')]}>
          <div class={this.getStyleName('content')}>
            <router-link
              class="flex-stretch"
              to={this.$utils.getUrl({
                path: routerConfig.userInfo.path,
                query: { _id: user._id },
              })}
            >
              <UserAvatar user={user} />
              <span class={this.getStyleName('profile')}>
                {user.profile || dev.defaultProfile}
              </span>
            </router-link>
            <FollowButton user={user} />
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
            const rs = await testApi.followQuery(data)
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
