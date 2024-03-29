import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop } from '@/components/decorator'
import * as helpers from '@/helpers'
import { dev, myEnum } from '@/config'
import { routerConfig } from '@/router'
import { testApi, testSocket } from '@/api'
import { LocalStore } from '@/store'
import {
  Input,
  Form,
  FormItem,
  Button,
  Checkbox,
  Spin,
  Icon,
  AutoComplete,
  Option,
} from '@/components/iview'
import { MyLoad } from '@/components/my-load'
import { LoginUser } from '@/model/user'
import { env } from '@/config'

import { Base } from '../base'
import { DetailDataType as UserDetailDataType } from './user-mgt'
import { UserUnbind } from './user'
import { LocalStoreUser } from './model'

import './user.less'

class SignProp {
  @Prop()
  account?: string

  @Prop()
  by?: string

  @Prop()
  byVal?: string

  @Prop()
  noTitle?: boolean
}

type SignInDataType = {
  account?: string
  password?: string
}

class SignInProp extends SignProp {}
@Component({
  extends: Base,
  props: SignInProp,
})
export class SignIn extends Vue<SignInProp, Base> {
  stylePrefix = 'user-sign-in-'
  private innerDetail: SignInDataType = this.getDetailData()
  private getDetailData() {
    return {
      account: '',
      password: '',
    }
  }

  private rules = {
    account: [{ required: true }],
    password: [{ required: true }],
  }

  $refs: { formVaild: iView.Form }
  private loading = false

  protected created() {
    if (this.account) {
      this.innerDetail.account = this.account
    }
  }
  private async handleSignIn() {
    await this.operateHandler(
      '登录',
      async () => {
        this.loading = true
        const { account, password } = this.innerDetail
        const req = { account, rand: helpers.randStr() }
        const token = LoginUser.createToken(account, password, req)
        LocalStore.setItem(dev.cacheKey.testUser, token)
        const rs = await testApi.userSignIn(req)

        let list = LocalStoreUser.getList()
        if (!list) {
          list = []
        }
        const remberSignIn: LocalStoreUser = { account }
        if (this.remberPwd) {
          remberSignIn.password = password
        } else {
          this.innerDetail.password = ''
        }
        LocalStoreUser.updateAccount(remberSignIn, list)
        this.setLoginUser(rs)
        this.$emit('success')
        if (this.to) {
          this.goToPage({ path: this.to, query: this.toQuery })
        }
      },
      {
        validate: this.$refs.formVaild.validate,
      },
    ).finally(() => {
      this.loading = false
    })
  }

  private handlePress(e) {
    if (this.$utils.isPressEnter(e)) {
      this.handleSignIn()
    }
  }

  to = ''
  toQuery = null
  remberPwd = false
  signInUsers = []
  mounted() {
    if (location.pathname === routerConfig.userSignIn.path) {
      const { to, ...query } = this.$route.query
      this.to = (to as string) || routerConfig.index.path
      this.toQuery = query
    }
    const list = this.setUserList()
    const detail = this.innerDetail
    if (list && list.length) {
      const rs = list[0]
      if (rs.account) {
        detail.account = rs.account
      }
      if (rs.password) {
        detail.password = rs.password
        this.remberPwd = true
      }
    }
  }

  setUserList() {
    this.signInUsers = LocalStoreUser.getList()
    return this.signInUsers
  }

  render() {
    const detail = this.innerDetail
    return (
      <div class="dialog-view" on-keypress={this.handlePress}>
        {!this.noTitle && <h3>登录</h3>}
        <br />
        <Form
          class="dialog-content"
          label-position="top"
          ref="formVaild"
          props={{ model: detail }}
          rules={this.rules}
        >
          <FormItem label="账号" prop="account">
            <AutoComplete
              v-model={detail.account}
              clearable
              on-on-select={(value) => {
                const match = this.signInUsers.find(
                  (ele) => ele.account === value,
                )
                detail.password = match?.password || ''
                this.remberPwd = !!detail.password
              }}
            >
              {this.signInUsers
                .filter(
                  (ele) =>
                    !detail.account || ele.account.includes(detail.account),
                )
                .map((ele) => {
                  const opt = (
                    <i-option key={ele.account} value={ele.account}>
                      <span>{ele.account}</span>
                    </i-option>
                  )
                  const icon = (
                    <Icon
                      type="md-close"
                      class={this.getStyleName('account-item-del')}
                      nativeOn-click={() => {
                        LocalStoreUser.delAccount(ele.account, this.signInUsers)
                      }}
                    />
                  )
                  icon.componentOptions.tag = ''
                  return (
                    <div class={this.getStyleName('account-item')}>
                      {opt}
                      {icon}
                    </div>
                  )
                })}
            </AutoComplete>
          </FormItem>
          <FormItem label="密码" prop="password">
            <Input
              v-model={detail.password}
              type="password"
              clearable
              autocomplete="new-password"
            />
          </FormItem>
          <FormItem>
            <label>
              <Checkbox v-model={this.remberPwd} />
              记住密码
            </label>
          </FormItem>
          <FormItem>
            <Button
              type="primary"
              long
              on-click={this.handleSignIn}
              loading={this.loading}
            >
              登录
            </Button>
          </FormItem>
          <ThirdPartyLogin />
        </Form>
      </div>
    )
  }
}

class ThirdPartyLoginProp {
  @Prop()
  bind?: boolean

  @Prop()
  user?: UserDetailDataType
}
@Component({
  extends: Base,
  props: ThirdPartyLoginProp,
})
export class ThirdPartyLogin extends Vue<ThirdPartyLoginProp, Base> {
  stylePrefix = 'third-party-login-'

  $refs: { userUnbind: UserUnbind }
  render() {
    return (
      <div class={this.getStyleName('root', this.bind && 'bind')}>
        {this.bind && (
          <UserUnbind
            ref="userUnbind"
            on-success={(type) => {
              this.user.bind[type] = false
            }}
          />
        )}
        {[
          {
            oauthName: myEnum.oauthName.微信,
            src: '/logo/weixin.svg',
            click: (data?) => {
              if (true) {
                this.$Modal.warning({
                  title: '警告',
                  content: '订阅号无法获取用户信息,已停用',
                })
                return
              }
              let query = { type: myEnum.wxAuthType.登录 }
              if (data?.bindData) query = data.bindData
              this.goToPage({ path: routerConfig.wxAuth.path, query })
            },
            bindData: { type: myEnum.wxAuthType.绑定 },
          },
          {
            oauthName: myEnum.oauthName.github,
            src: '/logo/github.svg',
            click: () => {
              let query: any = {
                client_id: env.github.clientId,
                state: helpers.randStr(),
              }
              if (this.bind) {
                query.state += '_bind'
              }
              this.$utils.openWindow(
                {
                  path: 'https://github.com/login/oauth/authorize',
                  query,
                },
                '_self',
              )
            },
          },
        ].map((ele) => {
          const noBind = this.bind && !this.user.oauth[ele.oauthName]
          return (
            <img
              class={{
                ...this.getStyleName('item'),
                disabled: noBind,
              }}
              src={ele.src}
              on-click={() => {
                if (!this.bind) {
                  ele.click()
                } else {
                  if (noBind) {
                    ele.click(ele)
                  } else {
                    this.$refs.userUnbind.show(ele.oauthName)
                  }
                }
                this.storeSetting.setSetting({
                  signInShow: false,
                })
                this.$emit('item-click', ele)
              }}
            />
          )
        })}
      </div>
    )
  }
}

type SignUpDataType = {
  account: string
  nickname: string
  password: string
  passwordRepeat: string
}

class SignUpProp extends SignProp {
  @Prop()
  nickname?: string

  @Prop()
  oauthToken?: string
}
@Component({
  extends: Base,
  props: SignUpProp,
})
export class SignUp extends Vue<SignUpProp, Base> {
  stylePrefix = 'user-sign-up-'
  private innerDetail: SignUpDataType = this.getDetailData()
  private getDetailData() {
    return {
      account: '',
      nickname: '',
      password: '',
      passwordRepeat: '',
    }
  }

  private rules = {
    account: [
      { required: true },
      {
        asyncValidator: async (rule, value) => {
          const rs = await testApi.userAccountExists({ val: value })
          if (rs) {
            throw new Error('账号已存在')
          }
        },
        trigger: ['changed', 'blur'],
      },
    ],
    nickname: [{ required: true }],
    password: [{ required: true }],
    passwordRepeat: [
      {
        required: true,
      },
      {
        validator: (rule, value, callback) => {
          if (value !== this.innerDetail.password) {
            callback(new Error('两次输入密码不一致'))
          } else {
            callback()
          }
        },
      },
    ],
  }

  $refs: { formVaild: iView.Form }

  protected created() {
    if (this.account) {
      this.innerDetail.account = this.innerDetail.nickname = this.account
    }
    if (this.nickname) {
      this.innerDetail.nickname = this.nickname
    }
  }
  private loading = false

  private async handleSignUp() {
    await this.operateHandler(
      '注册',
      async () => {
        this.loading = true
        const data: any = {
          ...this.innerDetail,
        }
        if (this.by) {
          data.by = this.by
        }
        if ([myEnum.userBy.微信授权].includes(this.by)) {
          data.byVal = this.byVal
        }
        data.oauthToken = this.oauthToken

        const rs = await testApi.userSignUp(data)
        this.innerDetail = this.getDetailData()
        this.$emit('success')
        this.goToPage(routerConfig.userSignIn.path)
      },
      {
        validate: this.$refs.formVaild.validate,
      },
    ).finally(() => {
      this.loading = false
    })
  }

  private handlePress(e) {
    if (this.$utils.isPressEnter(e)) {
      this.handleSignUp()
    }
  }

  render() {
    return (
      <MyLoad
        loadFn={async () => {
          await testApi.userSignUpCheck()
        }}
        renderFn={() => {
          return this.renderFn()
        }}
      />
    )
  }

  private renderFn() {
    const detail = this.innerDetail
    return (
      <div class="dialog-view" on-keypress={this.handlePress}>
        {!this.noTitle && <h3>注册</h3>}
        <br />
        <Form
          class="dialog-content"
          label-position="top"
          ref="formVaild"
          props={{ model: detail }}
          rules={this.rules}
        >
          <FormItem label="账号" prop="account">
            <Input v-model={detail.account} />
          </FormItem>
          <FormItem label="昵称" prop="nickname">
            <Input v-model={detail.nickname} />
          </FormItem>
          <FormItem label="密码" prop="password">
            <Input v-model={detail.password} type="password" />
          </FormItem>
          <FormItem label="确认密码" prop="passwordRepeat">
            <Input v-model={detail.passwordRepeat} type="password" />
          </FormItem>
          <FormItem>
            <Button
              type="primary"
              long
              on-click={this.handleSignUp}
              loading={this.loading}
            >
              注册
            </Button>
          </FormItem>
        </Form>
      </div>
    )
  }
}
