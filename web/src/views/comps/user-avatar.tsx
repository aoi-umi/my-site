import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop } from '@/components/decorator'
import { Avatar, Badge } from '@/components/iview'
import { Base } from '../base'
import { UserPoptip } from './user-poptip'

import './user-avatar.less'

export type User = {
  _id?: string;
  nickname?: string;
  account?: string;
  avatarUrl?: string;
  followStatus?: number;
  followEachOther?: boolean;
};

class UserAvatarProp {
  @Prop()
  user: User;

  @Prop()
  showAccount?: boolean;

  // default text
  @Prop()
  type?: string;

  @Prop()
  size?: iView.Avatar['size'];

  @Prop()
  noTips?: boolean;

  @Prop()
  isAuthor?: boolean;

  @Prop()
  self?: boolean;

  @Prop({
    default: 'right-start'
  })
  tipsPlacement?: iView.Poptip['placement'];
}
@Component({
  extends: Base,
  props: UserAvatarProp
})
export class UserAvatar extends Vue<UserAvatarProp, Base> {
  stylePrefix = 'comp-user-avatar-';

  avatarUrl = '';

  created() {
    this.init(this.user)
  }

  private init(user: User) {
    this.avatarUrl = (user && user.avatarUrl) || ''
  }

  @Watch('user')
  watchUser(newVal, oldVal) {
    this.init(newVal)
  }

  get count() {
    return 0
  }
  render() {
    if (this.type === 'text') {
      return (
        <div class={this.getStyleName('root')}>
          <UserPoptip
            user={this.user}
            tipsPlacement={this.tipsPlacement}
            noTips={this.noTips}
            self={this.self}
          >
            <span class={['not-important']}>{this.user.nickname}</span>
          </UserPoptip>
        </div>
      )
    }
    return (
      <div class={this.getStyleName('root')}>
        <UserPoptip
          user={this.user}
          tipsPlacement={this.tipsPlacement}
          noTips={this.noTips}
          self={this.self}
        >
          <Badge dot count={this.count}>
            <Avatar
              class={this.getStyleName('avatar').concat('shadow')}
              icon='md-person'
              size={this.size}
              src={this.avatarUrl}
            />
          </Badge>
        </UserPoptip>
        <span class={this.getStyleName('text').concat('not-important')}>{this.user.nickname}{this.showAccount && `(${this.user.account})`}{this.isAuthor && `(发布者)`}</span>
      </div>
    )
  }
}

