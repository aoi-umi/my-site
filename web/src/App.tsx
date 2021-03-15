import { Component, Vue, Watch } from 'vue-property-decorator'

import { routerConfig, MyRouteConfig } from '@/router'
import {
  Icon, Content, Layout, Header, Button, Modal, BackTop, Spin
} from '@/components/iview'
import { MyLoad } from '@/components/my-load'
import { LocalStore } from '@/store'

import { testApi, testSocket } from './api'
import { dev, env } from './config'
import { SignIn, SignInModel } from './views/user/user-sign'
import { Base } from './views/base'
import { UserAvatarView } from './views/comps/user-avatar'
import { SideMenuView, SideMenu, MenuConfig } from './views/comps/side-menu'
import './App.less'

@Component
export default class App extends Base {
  theme = 'light' as any;
  title = '';
  $refs: { sideMenu: SideMenu, signIn: SignInModel };

  async logPV () {
    testApi.statPVSave({ path: this.$route.path })
  }

  activeName = '';
  getActiveNameByPath (path: string) {
    return this.$refs.sideMenu?.getActiveNameByPath(path)
  }

  setActiveNameByPath () {
    this.activeName = this.getActiveNameByPath(location.pathname)
  }

  protected created () {
    this.setRouteTitle()
    this.getUserInfo()
    this.setMenuCfg()
    testApi.serverInfo()
    this.logPV()
  }

  protected mounted () {
  }

  private initAfterRender () {
    this.setActiveNameByPath()
  }

  setRouteTitle () {
    this.title = this.$route.meta.title || ''
    document.title = this.title || env.title
  }
  getingUserInfo = false;
  async getUserInfo () {
    this.getingUserInfo = true
    let token = LocalStore.getItem(dev.cacheKey.testUser)
    if (token) {
      await testApi.userInfo().then(user => {
        this.storeUser.setUser(user)
        testSocket.login({ [dev.cacheKey.testUser]: token })
        if (user) {
          if (location.pathname === routerConfig.userSignIn.path) {
            let { to, ...query } = this.$route.query
            to = (to as string) || routerConfig.index.path
            const toQuery = query
            this.$router.push({ path: to, query: toQuery })
          }
        }
      }).catch(e => {
        token = ''
        console.error(e)
      })
    }
    this.getingUserInfo = false

    if (token && testSocket.socket.connected) {
      testSocket.login({ [dev.cacheKey.testUser]: token })
    }
  }

  toggleSider () {
    this.$refs.sideMenu.toggleSider()
  }

  @Watch('$route')
  route (to, from) {
    this.setRouteTitle()
    this.setActiveNameByPath()
    this.logPV()
  }

  private menuCfg: MenuConfig[] = [];
  private setMenuCfg () {
    this.menuCfg = [{
      routerConfig: routerConfig.bookmark,
      icon: 'md-home',
      show: false
    }, {
      routerConfig: routerConfig.video,
      icon: 'logo-youtube'
    }, {
      routerConfig: routerConfig.article,
      icon: 'md-paper'
    }, {
      routerConfig: routerConfig.goods,
      icon: 'md-cart'
    }, {
      routerConfig: routerConfig.apps,
      icon: 'md-apps'
    }, {
      text: '我的',
      icon: 'md-person',
      name: 'my',
      children: [{
        routerConfig: routerConfig.contentMgt,
        icon: 'md-create'
      }, {
        routerConfig: routerConfig.payMgt,
        icon: 'logo-usd'
      }, {
        routerConfig: routerConfig.goodsMgt,
        icon: 'md-nutrition'
      }, {
        routerConfig: routerConfig.imgMgt,
        icon: 'md-image'
      }]
    }, {
      text: '管理',
      icon: 'md-cog',
      name: 'mgt',
      children: [{
        routerConfig: routerConfig.userMgt,
        icon: 'md-people'
      }, {
        routerConfig: routerConfig.role,
        icon: 'md-person'
      }, {
        routerConfig: routerConfig.authority,
        icon: 'md-lock'
      }, {
        text: '资金',
        name: 'asset',
        icon: 'md-stats',
        children: [{
          routerConfig: routerConfig.assetMgtLog,
          icon: 'logo-usd'
        }, {
          routerConfig: routerConfig.assetMgtNotify,
          icon: 'md-copy'
        }]
      }, {
        routerConfig: routerConfig.setting,
        icon: 'md-settings'
      }]
    }, {
      routerConfig: routerConfig.stat,
      icon: 'md-pie'
    }, {
      routerConfig: routerConfig.printMgt,
      icon: 'md-print'
    }].map(ele => this.convMenu(ele))
  }

  private convMenu (ele) {
    const { routerConfig, children, ...rest } = ele
    let obj = {} as any
    const routeCfg = routerConfig as MyRouteConfig
    if (routeCfg) {
      obj.to = routeCfg.path
      obj.text = routeCfg.text
      if (routeCfg.meta.authority) { obj.show = () => this.storeUser.user.hasAuth(routeCfg.meta.authority) }
    }
    obj = { ...obj, ...rest }
    if (children && children.length) {
      obj.children = children.map(child => this.convMenu(child))
    }
    return obj
  }

  protected render () {
    return (
      <MyLoad loadFn={() => { }} renderFn={this.renderMain} afterLoad={() => {
        this.initAfterRender()
      }} />
    )
  }
  protected renderMain () {
    return (
      <Layout class='layout no-bg'>
        <Modal v-model={this.storeSetting.setting.signInShow} footer-hide on-on-visible-change={(val) => {
          if (val && this.$refs.signIn) { this.$refs.signIn.setUserList() }
        }}>
          <SignIn
            ref='signIn'
            on-success={() => {
              this.storeSetting.setSetting({
                signInShow: false
              })
            }}
            on-3rd-party-login-click={() => {
              this.storeSetting.setSetting({
                signInShow: false
              })
            }} />
        </Modal>
        <Header class='layout-header-bar'>
          <Icon
            on-click={this.toggleSider}
            class='menu-icon'
            type='md-menu'
            size='24'
          />
          <span>{this.title}</span>
          <div class='layout-header-wrap'></div>
          <div class='layout-header-right button-group-normal'>
            {this.storeUser.user.isLogin
              ? <UserAvatarView user={this.storeUser.user} self tipsPlacement='bottom' />
              : [
                <Button type='primary' on-click={() => {
                  this.storeSetting.setSetting({
                    signInShow: true
                  })
                }}>登录</Button>,
                <Button on-click={() => {
                  this.$router.push(routerConfig.userSignUp.path)
                }}>注册</Button>
              ]
            }
          </div>
        </Header>
        <SideMenuView ref='sideMenu' menuCfg={this.menuCfg} activeName={this.activeName}>
          <Content class='main-content'>
            {
              this.getingUserInfo ? <Spin fix />
                : this.$route.meta.keepAlive
                  ? <keep-alive>
                    <router-view></router-view>
                  </keep-alive>
                  : <router-view></router-view>
            }
          </Content>
          <BackTop bottom={100} right={10} />
        </SideMenuView>
      </Layout>
    )
  }
}
