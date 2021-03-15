import { Component, Vue, Watch } from 'vue-property-decorator'

import { Prop } from '@/components/property-decorator'
import {
  Menu, MenuItem,
  Icon, Content, Sider, Layout, Submenu, Tooltip, Poptip
} from '@/components/iview'
import { convClass, getCompOpts } from '@/components/utils'
import * as style from '@/components/style'

import { Base } from '../base'
import './side-menu.less'
import cfg from '@/router/cfg'

export type MenuConfig = {
    name?: string;
    to: string;
    text: string;
    icon?: string;
    show?: boolean | (() => boolean);
    children?: MenuConfig[];
};

class SideMenuProp {
    @Prop()
    menuCfg: MenuConfig[];

    @Prop({ default: '' })
    activeName?: string;

    // @Prop({ default: 'left' })
    // placement?: 'left' | 'right';

    @Prop({ default: 180 })
    width?: number;

    @Prop({ default: 65 })
    collapsedWidth?: number;
}
@Component({
  extends: Base,
  mixins: [getCompOpts(SideMenuProp)]
})
export class SideMenu extends Vue<SideMenuProp & Base> {
    stylePrefix = 'comp-side-menu-';
    $refs: { sider: any, menu: iView.Menu };
    isCollapsed = true;
    private openNames = [];
    mounted () {
      this.isCollapsed = this.isSmall
    }
    @Watch('openNames')
    private watchOpenNames () {
      this.$nextTick(() => {
        this.$refs.menu.updateOpened()
      })
    }

    @Watch('$route')
    route (to, from) {
      if (this.isSmall && !this.isCollapsed) { this.isCollapsed = true }
    }

    get siderWidth () {
      return this.width
    }

    toggleSider () {
      this.$refs.sider.toggleCollapse()
    }
    getMenuName (data: MenuConfig) {
      let name = data.name
      if (!name && data.to) { name = this.getActiveNameByPath(data.to, false) }
      return name
    }

    getActiveNameByPath (path: string, setOpenNames = true) {
      const { name, openNames } = this.findCfg(this.menuCfg, path)
      if (setOpenNames) {
        this.openNames = Array.from(new Set([...this.openNames, ...openNames]))
      }
      return name
    }

    private findCfg (data: MenuConfig[], path: string, matchLen = 0) {
      let name = ''
      let openNames = []
      for (const ele of data) {
        const list = []
        const pathName = ele.name || ele.to
        if (path.startsWith(ele.to) && ele.to.length > matchLen) {
          name = ele.to
          matchLen = name.length
          openNames = list
        }
        if (pathName) { list.push(pathName) }
        if (ele.children) {
          const { name: childName, openNames: childOpenNames } = this.findCfg(ele.children, path, matchLen)
          const childLen = childName.length
          if (childLen > matchLen) {
            name = childName
            matchLen = childLen
            openNames = list
          }
          list.push(...childOpenNames)
        }
      }
      return { name, openNames }
    }

    filterMenu (list: MenuConfig[]) {
      return list.filter((ele: MenuConfig) => {
        const show = this.isMenuItemShow(ele)
        return show
      })
    }

    private isMenuItemShow (ele: MenuConfig) {
      let show = ele.show
      if (!ele.hasOwnProperty('show')) {
        show = true
      } else if (typeof ele.show === 'function') {
        show = ele.show()
      }
      if (show && ele.children) {
        const childShowLen = ele.children.map(child => this.isMenuItemShow(child)).filter(s => s)
        if (childShowLen.length === 0) { show = false }
      }
      return show
    }

    renderMenu () {
      return this.filterMenu(this.menuCfg).map(data => { return this.renderMenuItem(data) })
    }
    private defaultIcon = 'md-apps';
    renderMenuItem (data: MenuConfig, child = false) {
      if (!data.children || !data.children.length) {
        return this.getMenu(data)
      }

      const name = this.getMenuName(data)
      return (
        <Submenu class={this.getStyleName('sub-menu')} name={name}>
          <template slot='title'>
            <Tooltip disabled={!this.isCollapsed} class={this.getStyleName('tooltip')} content={data.text} placement='right' transfer>
              <div class={this.getStyleName('sub-menu-title')}>
                <Icon type={data.icon || this.defaultIcon} />
                <span class={this.getStyleName('text')}>{data.text}</span>
              </div>
            </Tooltip >
          </template>
          {this.filterMenu(data.children).map(ele => this.renderMenuItem(ele, true))}
        </Submenu>
      )
    }

    private getMenu (data: MenuConfig) {
      return (
        <Tooltip disabled={!this.isCollapsed} class={this.getStyleName('tooltip')} content={data.text} placement='right' transfer>
          {this.getMenuItem(data)}
        </Tooltip>
      )
    }

    private getMenuItem (data: MenuConfig) {
      const name = this.getMenuName(data)
      if (!name) { console.log(data) }
      return (
        <MenuItem key={data.to} class={this.getStyleName('item')} name={name} to={data.to}>
          <Icon type={data.icon || this.defaultIcon} />
          <span class={this.getStyleName('text')}>{data.text}</span>
        </MenuItem>
      )
    }

    render () {
      const collapsedWidth = this.isSmall ? 0 : this.collapsedWidth
      return (
        <Layout class={[...this.getStyleName('root'), 'no-bg', this.isCollapsed ? '' : 'open']}>
          <Sider
            class={this.getStyleName('sider')}
            ref='sider'
            hide-trigger
            collapsible
            collapsed-width={collapsedWidth}
            width={this.siderWidth}
            v-model={this.isCollapsed}
          >
            <Menu
              ref='menu'
              active-name={this.activeName}
              theme={'dark'}
              width='auto'
              class={this.getStyleName('menu')}
              open-names={this.openNames}
              on-on-select={() => {
                if (this.isSmall) { this.isCollapsed = true }
              }}
            >
              {this.renderMenu()}
            </Menu>
          </Sider>
          {!this.isSmall ? <Content class={this.getStyleName('blank')} style={{
            flex: `0 0 ${this.isCollapsed ? collapsedWidth : this.siderWidth}px`
          }}></Content>
            : <transition name='fade'>
              <div class={[style.cls.mask, ...this.getStyleName('mask')]} v-show={!this.isCollapsed} on-click={() => {
                this.isCollapsed = true
              }}></div>
            </transition>
          }
          {this.$slots.default}
        </Layout>
      )
    }
}

export const SideMenuView = convClass<SideMenuProp>(SideMenu)
