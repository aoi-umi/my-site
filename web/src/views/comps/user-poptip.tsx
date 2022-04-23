import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop } from '@/components/decorator'
import { testApi, testSocket } from '@/api'
import { dev, myEnum, authority } from '@/config'
import { routerConfig } from '@/router'
import { LocalStore } from '@/store'
import { Button, Avatar, Poptip, Spin } from '@/components/iview'
import { MyImgViewer } from '@/components/my-img-viewer'

import { Base } from '../base'
import { DetailDataType } from '../user/user-mgt'
import { FollowButton } from './follow-button'

import './user-poptip.less'

export type User = {
  _id?: string;
  nickname?: string;
  account?: string;
  avatarUrl?: string;
  followStatus?: number;
  followEachOther?: boolean;
};

class UserPoptipProp {
  @Prop()
  user: User;

  @Prop()
  noTips?: boolean;

  @Prop()
  self?: boolean;

  @Prop()
  showAccount?: boolean;

  @Prop()
  hideAvatar?: boolean;

  @Prop({
    default: 'right-start'
  })
  tipsPlacement?: iView.Poptip['placement'];

  @Prop()
  size?: iView.Avatar['size'];
}
@Component({
  extends: Base,
  props: UserPoptipProp
})
export class UserPoptip extends Vue<UserPoptipProp, Base> {
  stylePrefix = 'comp-user-poptip-';

  private userDetail: DetailDataType = {};
  avatarUrl = '';

  $refs: { imgViewer: MyImgViewer };

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

  signOut() {
    const token = LocalStore.getItem(dev.cacheKey.testUser)
    if (token) {
      testApi.userSignOut()
      testSocket.logout({ [dev.cacheKey.testUser]: token })
      LocalStore.removeItem(dev.cacheKey.testUser)
    }
    for (const key in routerConfig) {
      const rtCfg = routerConfig[key]
      if (rtCfg.path === this.$route.path) {
        if (rtCfg.authority && rtCfg.authority.includes(authority.login)) { this.$router.go(0) }
        break
      }
    }
    this.storeUser.setUser(null)
  }
  loading = false;
  loadFailMsg = '';
  getUserDetail() {
    if (!this.self && (!this.userDetail._id || this.userDetail._id != this.user._id)) {
      this.operateHandler('', async () => {
        this.loadFailMsg = ''
        this.loading = true
        this.userDetail = await testApi.userDetailQuery({ _id: this.user._id })
      }, { noDefaultHandler: true }).then(rs => {
        if (!rs.success) { this.loadFailMsg = '获取用户信息出错' }
      }).finally(() => {
        this.loading = false
      })
    }
  }

  render() {
    const loadFail = !!this.loadFailMsg
    const notSelf = this.user._id !== this.storeUser.user._id
    return (
      <div class={this.getStyleName('root')}>
        <Poptip class='pointer' disabled={this.noTips} trigger='hover' transfer
          placement={this.tipsPlacement} on-on-popper-show={() => {
            this.getUserDetail()
          }}
          nativeOn-click={(e: MouseEvent) => {
            e.stopPropagation()
          }}
        >
          {this.$slots.default}
          {this.self ?
            <div slot='content' class={this.getStyleName('content')}>
              <router-link class='ivu-select-item' to={routerConfig.userInfo.path}>
                主页
              </router-link>
              <router-link class='ivu-select-item' to={routerConfig.viewHistory.path}>
                {routerConfig.viewHistory.text}
              </router-link>
              <p class='ivu-select-item' on-click={this.signOut}>退出</p>
            </div>
            : <div slot='content' class={this.getStyleName('content')}>
              {loadFail
                ? <div class='center'>
                  {this.loadFailMsg}
                </div>
                : <div>
                  {this.loading && <Spin fix />}
                  <div class={this.getStyleName('avatar-box').concat('center')}>
                    <Avatar class='shadow' icon='md-person' src={this.userDetail.avatarUrl} size='large'
                      nativeOn-click={() => {
                        if (this.avatarUrl) {
                          this.$refs.imgViewer.show()
                        }
                      }} />

                    <div class='not-important'>{this.user.nickname}({this.user.account})</div>
                  </div>
                  <br />
                  {this.userDetail.profile || dev.defaultProfile}
                  <br />
                  关注: {this.userDetail.following}  粉丝: {this.userDetail.follower}
                </div>
              }
              <br />
              <div class={['center', 'button-group-normal']}>
                {!!this.loadFailMsg &&
                  <Button on-click={() => {
                    this.getUserDetail()
                  }}>重试</Button>}
                <Button>
                  <router-link to={this.$utils.getUrl({
                    path: routerConfig.userInfo.path,
                    query: { _id: this.user._id }
                  })}>主页</router-link>
                </Button>
                {!loadFail && notSelf && <FollowButton user={this.userDetail} />}
                {notSelf && <Button on-click={() => {
                  this.goToPage({
                    path: routerConfig.userChat.path,
                    query: { _id: this.user._id }
                  })
                }}>私信</Button>}
              </div>
            </div>
          }
        </Poptip>
        {this.avatarUrl && <MyImgViewer src={this.avatarUrl} ref='imgViewer' />}
      </div>
    )
  }
}
