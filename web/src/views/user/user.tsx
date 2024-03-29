import { Watch } from 'vue-property-decorator'

import { Component, Vue } from '@/components/decorator'
import { dev, myEnum } from '@/config'
import { testApi } from '@/api'
import {
  Modal,
  Input,
  Form,
  FormItem,
  Button,
  TabPane,
  Tabs,
} from '@/components/iview'
import { MyUpload, FileDataType } from '@/components/my-upload'
import { MyLoad } from '@/components/my-load'
import { LoginUser } from '@/model/user'

import { UserAvatar } from '../comps/user-avatar'
import { FollowButton } from '../comps/follow-button'
import { AuthorityTag } from '../comps/authority-tag'
import { RoleTag } from '../comps/role-tag'

import { Base } from '../base'
import Article from '../content/article'
import Video from '../content/video'
import { DetailDataType as UserDetailDataType } from './user-mgt'
import { ChatList } from './user-chat'
import { ThirdPartyLogin } from './user-sign'
import { FavouriteList } from './favourite'
import { FollowList } from './follow'
import { UserCommentList } from './userComment'
import { LogList } from './log'

import './user.less'
import { routerConfig } from '@/router'

@Component
export default class UserInfo extends Base {
  stylePrefix = 'user-detail-'
  detail: UserDetailDataType = {}
  tab = ''
  created() {
    this.initTab()
  }
  mounted() {
    this.load()
  }

  @Watch('$route')
  route(to, from) {
    this.load()
  }

  async load() {
    const query = this.$route.query as { [key: string]: string }
    const loadRs = this.$refs.loadView.result
    if (
      !loadRs.success ||
      (query._id && this.detail._id !== query._id) ||
      (!query._id && !this.storeUser.user.equalsId(this.detail._id))
    ) {
      this.initTab()
      await this.$refs.loadView.loadData()
    }
    if (loadRs.success) {
      if (myEnum.userTab.getAllValue().includes(query.tab)) {
        if (
          !this.storeUser.user.isLogin &&
          [myEnum.userTab.私信].includes(query.tab)
        ) {
          // 需要登录的
        } else {
          this.tab = query.tab
        }
      } else {
        this.tab = ''
      }
      this.handleSearch()
    }
  }

  async getUserDetail() {
    const query = this.$route.query
    let detail: UserDetailDataType
    const self = !query._id || this.storeUser.user.equalsId(query._id as string)
    if (self) {
      detail = await testApi.userDetail()
    } else {
      detail = await testApi.userDetailQuery({ _id: query._id })
    }
    detail.self = self
    this.detail = detail
    return detail
  }

  $refs: {
    formVaild: iView.Form
    loadView: MyLoad
    upload: MyUpload
  }
  updateLoading = false
  private getUpdateUser() {
    return {
      avatar: '',
      avatarUrl: '',
      nickname: '',
      pwd: '',
      newPwd: '',
      newPwdRepeat: '',
      profile: '',
    }
  }
  updateDetail = this.getUpdateUser()
  updateShow = false
  avatarList = []
  async toggleUpdate(show: boolean) {
    this.updateShow = show
    if (show) {
      this.updateDetail = {
        ...this.getUpdateUser(),
        avatar: this.detail.avatar,
        avatarUrl: this.detail.avatarUrl,
        nickname: this.detail.nickname,
        profile: this.detail.profile,
      }
      this.avatarList = this.updateDetail.avatarUrl
        ? [{ url: this.updateDetail.avatarUrl, fileType: FileDataType.图片 }]
        : []
      this.setRules()
    }
  }
  private rules = {}
  private setRules() {
    this.rules = {
      pwd: [
        {
          validator: (rule, value, callback) => {
            if (this.updateDetail.newPwd && !value) {
              callback(new Error('请输入密码'))
            } else {
              callback()
            }
          },
        },
      ],
      newPwd: [
        {
          validator: (rule, value, callback) => {
            if (value && value === this.updateDetail.pwd) {
              callback(new Error('新旧密码相同'))
            } else {
              callback()
            }
          },
        },
      ],
      newPwdRepeat: [
        {
          validator: (rule, value, callback) => {
            if (
              this.updateDetail.newPwd &&
              value !== this.updateDetail.newPwd
            ) {
              callback(new Error('两次输入密码不一致'))
            } else {
              callback()
            }
          },
        },
      ],
    }
  }

  handleUpdate() {
    this.operateHandler(
      '修改',
      async () => {
        this.updateLoading = true
        const upload = this.$refs.upload
        const err = await upload.upload()
        if (err.length) {
          throw new Error(`上传头像失败:${err[0]}`)
        }
        const file = upload.fileList[0]
        if (file && file.uploadRes) {
          this.updateDetail.avatar = file.uploadRes
        }

        const user = this.storeUser.user
        let req: any = {}
        let logOut = false
        const detail = this.detail
        const updateKey = ['nickname', 'profile', 'avatar']
        updateKey.forEach((key) => {
          req[key] = this.updateDetail[key]
        })
        if (this.updateDetail.newPwd) {
          logOut = true
          req = {
            ...req,
            newPassword: this.updateDetail.newPwd,
          }
          req = LoginUser.createReqWithToken(
            user.account,
            this.updateDetail.pwd,
            req,
          )
        }
        if (Object.keys(req).length) {
          const rs = await testApi.userUpdate(req)
          if (logOut) {
            this.storeUser.setUser(null)
          } else {
            this.storeUser.setUser({
              ...this.storeUser.user,
              ...rs,
            })
            this.detail = {
              ...this.detail,
              ...rs,
            }
          }
        }
        this.toggleUpdate(false)
      },
      {
        validate: this.$refs.formVaild.validate,
      },
    ).finally(() => {
      this.updateLoading = false
    })
  }

  private handlePress(e) {
    if (this.$utils.isPressEnter(e)) {
      this.handleUpdate()
    }
  }

  private tabLoaded = {}
  private initTab() {
    myEnum.userTab.toArray().forEach((ele) => {
      this.tabLoaded[ele.value] = false
    })
  }

  private handleSearch() {
    if (!(this.tab in this.tabLoaded)) {
      return
    }
    const loaded = this.tabLoaded[this.tab]
    if (loaded) {
      return
    }
    if (false) {
      // some special
    } else {
      this.$refs[this.tab]?.query()
    }
    this.tabLoaded[this.tab] = true
  }

  render() {
    return (
      <div>
        <MyLoad
          ref="loadView"
          notLoadOnMounted
          loadFn={this.getUserDetail}
          renderFn={() => {
            return this.renderInfo()
          }}
        />

        <Modal v-model={this.updateShow} footer-hide>
          <div class="dialog-view" on-keypress={this.handlePress}>
            <h3>修改</h3>
            <br />
            <Form
              class="dialog-content"
              ref="formVaild"
              label-position="top"
              props={{ model: this.updateDetail }}
              rules={this.rules}
            >
              <FormItem prop="avatar">
                <MyUpload
                  class="center"
                  ref="upload"
                  headers={testApi.defaultHeaders}
                  uploadUrl={testApi.imgUploadUrl}
                  successHandler={(res, file) => {
                    const rs = testApi.uplodaHandler(res)
                    file.url = rs.url
                    return rs.fileId
                  }}
                  format={['jpg', 'jpeg', 'png', 'bmp', 'gif']}
                  width={120}
                  height={120}
                  cropperOptions={{
                    autoCropWidth: 288,
                    autoCropHeight: 288,
                    fixedNumber: [1, 1],
                  }}
                  v-model={this.avatarList}
                  shape="circle"
                />
              </FormItem>
              <FormItem label="昵称" prop="nickname">
                <Input v-model={this.updateDetail.nickname} />
              </FormItem>
              <FormItem label="密码" prop="pwd">
                <Input
                  v-model={this.updateDetail.pwd}
                  type="password"
                  placeholder="不修改密码时不用填"
                />
              </FormItem>
              <FormItem label="新密码" prop="newPwd">
                <Input v-model={this.updateDetail.newPwd} type="password" />
              </FormItem>
              <FormItem label="确认密码" prop="newPwdRepeat">
                <Input
                  v-model={this.updateDetail.newPwdRepeat}
                  type="password"
                />
              </FormItem>
              <FormItem label="简介" prop="profile">
                <Input
                  v-model={this.updateDetail.profile}
                  placeholder={dev.defaultProfile}
                  type="textarea"
                />
              </FormItem>
              <FormItem>
                <Button
                  type="primary"
                  long
                  on-click={this.handleUpdate}
                  loading={this.updateLoading}
                >
                  修改
                </Button>
              </FormItem>
            </Form>
          </div>
        </Modal>
      </div>
    )
  }

  renderInfo() {
    const detail = this.detail
    const user = this.storeUser.user
    return (
      <div>
        <div class={this.getStyleName('main')}>
          <UserAvatar
            user={detail}
            size="large"
            noTips
            showAccount
            class={this.getStyleName('avatar')}
          />
          {detail.self && (
            <a
              on-click={() => {
                this.toggleUpdate(true)
              }}
              class={this.getStyleName('edit')}
            >
              修改
            </a>
          )}
          <div class="flex-stretch"></div>
          {!detail.self && (
            <div class={this.getStyleName('op-box')}>
              <FollowButton class={this.getStyleName('follow')} user={detail} />
              <Button
                on-click={() => {
                  this.goToPage({
                    path: routerConfig.userChat.path,
                    query: { _id: detail._id },
                  })
                }}
              >
                私信
              </Button>
            </div>
          )}
        </div>
        <Tabs
          animated={false}
          v-model={this.tab}
          class={this.getStyleName('tab')}
          on-on-click={(name: string) => {
            this.goToPage({
              path: this.$route.path,
              query: {
                ...this.$route.query,
                tab: name,
              },
            })
          }}
        >
          <TabPane label="概览">{this.renderUserDetail()}</TabPane>
          {detail.self && (
            <TabPane
              name={myEnum.userTab.日志}
              label={() => {
                return <div>日志</div>
              }}
            >
              <LogList ref={myEnum.userTab.日志} userId={this.detail._id} />
            </TabPane>
          )}
          <TabPane
            name={myEnum.userTab.视频}
            label={() => {
              return <div>视频: {detail.video}</div>
            }}
          >
            <Video
              ref={myEnum.userTab.视频}
              queryOpt={{ userId: detail._id }}
              notQueryOnRoute
              notQueryToRoute
              notQueryOnMounted
            />
          </TabPane>
          <TabPane
            name={myEnum.userTab.文章}
            label={() => {
              return <div>文章: {detail.article}</div>
            }}
          >
            <Article
              ref={myEnum.userTab.文章}
              queryOpt={{ userId: detail._id }}
              notQueryOnRoute
              notQueryToRoute
              notQueryOnMounted
            />
          </TabPane>
          <TabPane
            name={myEnum.userTab.粉丝}
            label={() => {
              return <div>粉丝: {detail.follower}</div>
            }}
          >
            <FollowList
              ref={myEnum.userTab.粉丝}
              userId={this.detail._id}
              followType={myEnum.followQueryType.粉丝}
            />
          </TabPane>
          <TabPane
            name={myEnum.userTab.关注}
            label={() => {
              return <div>关注: {detail.following}</div>
            }}
          >
            <FollowList
              ref={myEnum.userTab.关注}
              userId={this.detail._id}
              followType={myEnum.followQueryType.关注}
            />
          </TabPane>
          {detail.self && (
            <TabPane
              name={myEnum.userTab.收藏}
              label={() => {
                return <div>收藏</div>
              }}
            >
              <FavouriteList ref={myEnum.userTab.收藏} />
            </TabPane>
          )}
          {detail.self && (
            <TabPane
              name={myEnum.userTab.私信}
              label={() => {
                return <div>私信</div>
              }}
            >
              <ChatList ref={myEnum.userTab.私信} />
            </TabPane>
          )}
          {detail.self && (
            <TabPane
              name={myEnum.userTab.评论}
              label={() => {
                return <div>评论</div>
              }}
            >
              <UserCommentList ref={myEnum.userTab.评论} />
            </TabPane>
          )}
          {detail.self && (
            <TabPane
              name={myEnum.userTab.回复评论}
              label={() => {
                return <div>回复评论</div>
              }}
            >
              <UserCommentList ref={myEnum.userTab.回复评论} isReply />
            </TabPane>
          )}
        </Tabs>
      </div>
    )
  }

  renderUserDetail() {
    const detail = this.detail
    let labelWidth = 80
    return detail.self ? (
      <div>
        <UserUnbind
          ref="userUnbind"
          on-success={(type) => {
            detail.bind[type] = false
          }}
        />
        <Form class="form-no-error" label-width={labelWidth}>
          <FormItem label="状态">{detail.statusText}</FormItem>
          <FormItem label="简介">
            {detail.profile || dev.defaultProfile}
          </FormItem>
          <FormItem label="角色">
            <RoleTag value={detail.roleList} hideCode />
          </FormItem>
          <FormItem label="可用权限">
            <AuthorityTag value={Object.values(detail.auth)} hideCode />
          </FormItem>
          <FormItem label="注册时间">
            {this.$utils.dateFormat(detail.createdAt)}
          </FormItem>
          <FormItem label="绑定">
            <ThirdPartyLogin bind user={detail} />
          </FormItem>
        </Form>
      </div>
    ) : (
      <Form class="form-no-error" label-width={labelWidth}>
        <FormItem label="简介">{detail.profile || dev.defaultProfile}</FormItem>
        <FormItem label="注册时间">
          {this.$utils.dateFormat(detail.createdAt)}
        </FormItem>
      </Form>
    )
  }
}

class UserUnbindProp {}
@Component({
  extends: Base,
  props: UserUnbindProp,
})
export class UserUnbind extends Vue<UserUnbindProp, Base> {
  $refs: { unbind: iView.Form }
  isShow = false
  saving = false
  form = {
    pwd: '',
  }

  type: string

  show(type) {
    this.resetForm()
    this.type = type
    this.isShow = true
  }

  resetForm() {
    this.form.pwd = ''
  }

  rules = {
    pwd: [
      {
        required: true,
      },
    ],
  }

  handlePress(e) {
    if (this.$utils.isPressEnter(e)) {
      this.unbind()
    }
  }

  unbind() {
    this.operateHandler(
      '解绑',
      async () => {
        this.saving = true
        const user = this.storeUser.user

        let data = {
          type: this.type,
        }
        data = LoginUser.createReqWithToken(user.account, this.form.pwd, data)
        await testApi.userUnbind(data)
        this.$emit('success', data.type)
      },
      {
        validate: this.$refs.unbind.validate,
      },
    )
      .then((rs) => {
        if (rs.success) {
          this.isShow = false
          this.resetForm()
        }
      })
      .finally(() => {
        this.saving = false
      })
  }

  render() {
    return (
      <Modal v-model={this.isShow} title="确认解绑?" footer-hide>
        <div on-keypress={this.handlePress}>
          <Form
            class="dialog-content"
            ref="unbind"
            props={{ model: this.form }}
            rules={this.rules}
            nativeOn-submit={(e) => {
              e.preventDefault()
            }}
          >
            <FormItem label="请输入密码" prop="pwd">
              <Input type="password" v-model={this.form.pwd} />
            </FormItem>
            <FormItem>
              <Button
                type="primary"
                long
                on-click={this.unbind}
                loading={this.saving}
              >
                修改
              </Button>
            </FormItem>
          </Form>
        </div>
      </Modal>
    )
  }
}
