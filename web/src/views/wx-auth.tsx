import { Component, Vue, Watch } from 'vue-property-decorator'

import { testApi, testSocket } from '@/api'
import { myEnum, dev, env } from '@/config'
import { LocalStore } from '@/store'
import { routerConfig } from '@/router'
import * as helpers from '@/helpers'
import { Spin, Avatar, Button, Card } from '@/components/iview'
import { Utils } from '@/components/utils'
import { MyQrcode, IMyQrcode } from '@/components/my-qrcode'

import { Base } from './base'
import { SignUpView } from './user/user-sign'
import './wx-auth.less'

type WxUserInfo = {
    openid: string;
    nickname: string;
    sex: number;
    language: string;
    city: string;
    province: string;
    country: string;
    headimgurl: string;
    privilege: string[];
};
@Component
export default class WxAuth extends Base {
    stylePrefix = 'wx-auth-';
    $refs: { qrcode: IMyQrcode, qrcodeBind: IMyQrcode };
    mounted () {
      this.auth()
      this.$refs.qrcodeBind.drawQrcode(location.href)
      testSocket.bindAuthRecv((data) => {
        this.val = data.code
        this.signInByCode()
      })
    }

    @Watch('$route')
    private watchRouter () {
      this.auth()
    }

    wxUserInfo: WxUserInfo;
    loading = true;
    val = '';
    type = '';
    get qrcodeLoginShow () {
      return !this.storeUser.user.isLogin && this.type === myEnum.wxAuthType.登录
    }

    get qrcodeBindShow () {
      return this.storeUser.user.isLogin && this.type === myEnum.wxAuthType.绑定
    }

    async auth () {
      const query: any = this.$route.query
      this.val = query.code
      let type = this.type = query.type
      try {
        this.loading = true
        this.account = null
        this.wxUserInfo = null
        this.msg = ''
        this.errorMsg = ''
        if (query.getUserInfo) {
          this.wxUserInfo = await testApi.wxGetUserInfo({ code: this.val })
        } else {
          let to = false
          if (type === myEnum.wxAuthType.绑定) {
            if (this.storeUser.user.isLogin) { to = true } else { this.msg = '未登录' }
          } else if (type === myEnum.wxAuthType.登录) {
            if (!this.storeUser.user.isLogin) { to = true } else { this.msg = '已登录' }
          }
          if (to) {
            const isWx = Utils.isWxClient()
            const data: any = {}
            if (!isWx) {
              type = myEnum.wxAuthType.扫码
              data.token = helpers.randStr()
              testSocket.auth(data)
            }
            data.type = type
            const rs = this.getCodeUrl(data)
            if (isWx) {
              window.location.href = rs
            } else {
              this.$refs.qrcode.drawQrcode(rs)
            }
          }
        }
      } catch (e) {
        this.errorMsg = e.message
      } finally {
        this.loading = false
      }
      if (this.wxUserInfo) { await this.checkAccount(this.val) }
      return this.wxUserInfo
    }

    getCodeUrl (data: { type: string, token?: string }) {
      const uri = encodeURIComponent(`${location.origin}/wx/auth?type=${data.type}&getUserInfo=1&token=${data.token || ''}`)
      const url = 'https://open.weixin.qq.com/connect/oauth2/authorize?' +
            [
              `redirect_uri=${uri}`,
              `appid=${env.wxOffiaCcount.appId}`,
              `response_type=code&scope=snsapi_userinfo&state=1&connect_redirect=1#wechat_redirect`
            ].join('&')
      return url
    }

    accountChecking = false;
    errorMsg = '';
    msg = '';
    account: { _id?: string } = {};
    by = myEnum.userBy.微信授权;
    async checkAccount (val) {
      try {
        this.errorMsg = ''
        this.accountChecking = true
        this.account = await testApi.userAccountExists({ val, by: this.by })
      } catch (e) {
        this.errorMsg = e.message
      } finally {
        this.accountChecking = false
      }
    }

    signInLoading = false;
    signInByCode () {
      this.operateHandler('登录', async () => {
        this.signInLoading = true
        const req = { by: this.by, val: this.val }
        const rs = await testApi.userSignInByAuth(req)
        const token = rs.key
        LocalStore.setItem(dev.cacheKey.testUser, token)
        testSocket.login({ [dev.cacheKey.testUser]: token })
        this.storeUser.setUser(rs)
      }).finally(() => {
        this.signInLoading = false
      })
    }

    authSending = false;
    authMsg = '';
    authSend () {
      this.operateHandler('授权', async () => {
        this.authSending = false
        this.authMsg = ''
        const query = this.$route.query
        const rs = await testApi.wxCodeSend({
          code: query.code,
          token: query.token
        })
        this.authMsg = rs ? '授权成功' : '授权失败'
      }, { noDefaultHandler: true }).then(rs => {
        if (!rs.success) { this.authMsg = '授权出错' }
      }).finally(() => {
        this.authSending = false
      })
    }

    bindLoading = false;
    async userBind () {
      try {
        this.msg = ''
        this.errorMsg = ''
        this.bindLoading = true
        const data = { by: this.by, val: this.val }
        await testApi.userBind(data)
        this.msg = '绑定成功'
      } catch (e) {
        this.errorMsg = e.message
      } finally {
        this.bindLoading = false
      }
    }

    render () {
      const isScan = this.type === myEnum.wxAuthType.扫码
      return (
        <Card class={this.getStyleName('user-info-card')}>
          {this.loading ? <Spin fix />
            : this.errorMsg || this.msg
              ? <div class={this.getStyleName('err')}>
                {this.errorMsg || this.msg}
                {this.errorMsg && !isScan && <Button on-click={() => {
                  this.$router.push({
                    path: routerConfig.wxAuth.path,
                    query: { type: this.type }
                  })
                }}>重试</Button>}
              </div>
              : <div>
                {
                  isScan
                    ? <div class={this.getStyleName('auth')}>
                      {!this.account ? '无关联账号,请先绑定或注册'
                        : <div>
                          {this.authMsg || <Button loading={this.authSending} on-click={() => {
                            this.authSend()
                          }}>授权登录</Button>}
                        </div>
                      }
                    </div>
                    : this.storeUser.user.isLogin
                      ? <div class={this.getStyleName('logined')}>
                        <span>已登录</span>
                        {!this.loading && this.type === myEnum.wxAuthType.绑定 && Utils.isWxClient() &&
                                                <Button loading={this.bindLoading} on-click={() => { this.userBind() }}>绑定</Button>
                        }
                      </div>
                      : !this.wxUserInfo ? <div /> : this.renderUserInfo()
                }
              </div>
          }
          <div class={this.getStyleName('qrcode-box')} v-show={!Utils.isWxClient() && (this.qrcodeLoginShow || this.qrcodeBindShow)}>
            <div>使用微信扫一扫</div>
            <MyQrcode ref='qrcode' v-show={this.qrcodeLoginShow} />
            <MyQrcode ref='qrcodeBind' v-show={this.qrcodeBindShow} />
          </div>
        </Card>
      )
    }

    private renderUserInfo () {
      const userInfo = this.wxUserInfo
      return (
        <div class={this.getStyleName('user-info')}>
          <Avatar src={userInfo.headimgurl} size='large' />
          <span>{userInfo.nickname}</span>
          <div class={this.getStyleName('op')}>
            {this.accountChecking
              ? <Spin fix />
              : this.account
                ? <Button loading={this.signInLoading} on-click={() => { this.signInByCode() }}>登录</Button>
                : <SignUpView account={this.wxUserInfo.nickname} by={myEnum.userBy.微信授权} byVal={this.val} />
            }
          </div>
        </div>

      )
    }
}
