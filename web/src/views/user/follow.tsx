import { Component, Vue } from 'vue-property-decorator'

import { Prop } from '@/components/property-decorator'
import { testApi } from '@/api'
import { myEnum, dev } from '@/config'
import { routerConfig } from '@/router'
import { convClass, getCompOpts } from '@/components/utils'
import { Input, Card } from '@/components/iview'
import { MyList, IMyList, ResultType } from '@/components/my-list'

import { UserAvatarView } from '../comps/user-avatar'
import { FollowButtonView } from '../comps/follow-button'
import { Base } from '../base'

/**
 * 粉丝/关注
 */
class FollowListProp {
    @Prop({
      required: true
    })
    userId: string;

    @Prop({
      required: true
    })
    followType: number;
}

@Component({
  extends: Base,
  mixins: [getCompOpts(FollowListProp)]
})
export class FollowList extends Vue<FollowListProp & Base> {
    stylePrefix = 'user-follow-';

    $refs: {
        list: IMyList<any>,
    };
    anyKey = '';

    query () {
      this.$refs.list.handleQuery({ resetPage: true })
    }

    private async followQuery () {
      const opt = {
        anyKey: this.anyKey,
        userId: this.userId,
        type: this.followType
      }

      await this.$refs.list.query(opt)
    }

    private renderFn (rs: ResultType) {
      return rs.data.map(ele => {
        const user = this.followType == myEnum.followQueryType.粉丝 ? ele.followerUser : ele.followingUser
        return (
          <Card class={[...this.getStyleName('main'), 'pointer']} nativeOn-click={() => {
            this.$router.push({
              path: routerConfig.userInfo.path,
              query: { _id: user._id }
            })
          }}>
            <div class={this.getStyleName('content')}>
              <UserAvatarView user={user} />
              <span class={this.getStyleName('profile')}>{user.profile || dev.defaultProfile}</span>
              <div class='flex-stretch' />
              <FollowButtonView user={user} />
            </div>
          </Card>
        )
      })
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
              this.followQuery()
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

export const FollowListView = convClass<FollowListProp>(FollowList)
