import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop } from '@/components/decorator'
import { Card, Row, Col } from '@/components/iview'
import { routerConfig } from '@/router'

import { Base } from '../base'
import './apps.less'

@Component
export default class Apps extends Base {
  stylePrefix = 'apps-'
  apps = [
    {
      routerConfig: routerConfig.xiaobianBot,
      cover: '',
    },
    {
      routerConfig: routerConfig.beautify,
    },
  ].map((ele) => {
    const { routerConfig, ...rest } = ele
    return {
      url: routerConfig.path,
      text: routerConfig.text,
      ...rest,
    }
  })
  render() {
    return (
      <div class={this.getStyleName('main')}>
        {this.apps.map((ele) => {
          return (
            <router-link to={ele.url}>
              <Card class={this.getStyleName('item')}>
                <span>{ele.text}</span>
              </Card>
            </router-link>
          )
        })}
      </div>
    )
  }
}
