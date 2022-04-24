import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop } from '@/components/decorator'
import { Spin, Button, Card } from '@/components/iview'
import { myEnum } from '@/config'
import { testApi } from '@/api'
import { Base } from '../base'
import { User } from './user-avatar'

class FollowButtonProp {
  @Prop({
    required: true,
  })
  user: User
}
@Component({
  extends: Base,
  props: FollowButtonProp,
})
export class FollowButton extends Vue<FollowButtonProp, Base> {
  private innerUser = this.user

  get isFollow() {
    return this.innerUser.followStatus === myEnum.followStatus.已关注
  }

  @Watch('user')
  watchUser(newVal, oldVal) {
    this.innerUser = newVal
  }

  private async handleFollow() {
    const status = this.isFollow
      ? myEnum.followStatus.已取消
      : myEnum.followStatus.已关注
    this.operateHandler(this.isFollow ? '取消关注' : '关注', async () => {
      const rs = await testApi.followSave({ userId: this.user._id, status })
      this.innerUser = {
        ...this.innerUser,
        followStatus: rs.status,
        followEachOther: rs.followEachOther,
      }
    })
  }

  render() {
    return (
      <Button
        on-click={(e: MouseEvent) => {
          this.handleFollow()
          e.stopPropagation()
        }}
      >
        {this.innerUser.followEachOther
          ? '相互关注'
          : this.isFollow
          ? '已关注'
          : '关注'}
      </Button>
    )
  }
}
