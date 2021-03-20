import { Component, Vue, Watch } from 'vue-property-decorator'
import { routerConfig, MyRouteConfig } from '@/router'
import { Base } from '../base'

@Component({})
export default class App extends Base {
  list = [];
  created () {
    this.list = Object.entries(routerConfig).filter(ele => {
      return /^\/test\//.test(ele[1].path)
    }).map(ele => {
      let val = ele[1] as any
      return {
        href: val.path,
        text: val.text
      }
    })
  }

  render () {
    return (
      <div>
        {this.list.map(ele => {
          return (<div>
            <router-link to={ele.href}>{ele.text}</router-link>
          </div>)
        })}
      </div>
    )
  }
}
