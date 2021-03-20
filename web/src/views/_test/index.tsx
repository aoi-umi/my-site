import { Component, Vue, Watch } from 'vue-property-decorator'
import { routerConfig, MyRouteConfig } from '@/router'
import { Breadcrumb, BreadcrumbItem } from '@/components/iview'
import { Base } from '../base'

@Component({})
export default class App extends Base {
  list = [];
  created () {
    this.list = routerConfig.test.children.map(ele => {
      let val = ele
      return {
        href: `${routerConfig.test.path}/${val.path}`,
        text: val.text
      }
    })
  }

  get isRoot () {
    return this.$route.path === routerConfig.test.path
  }

  render () {
    return (
      <div>
        {this.isRoot
          ? this.list.map(ele => {
            return (<div>
              <router-link to={ele.href}>{ele.text}</router-link>
            </div>)
          })
          : <div>
            <Breadcrumb>
              <BreadcrumbItem to={routerConfig.test.path}>返回</BreadcrumbItem>
            </Breadcrumb>
            <br />
            <router-view></router-view>
          </div>}
      </div>
    )
  }
}
