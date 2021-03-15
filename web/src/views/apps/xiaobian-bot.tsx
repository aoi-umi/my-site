import { Component, Vue, Watch } from 'vue-property-decorator'
import { Card, Row, Col, Form, FormItem, Input, Button } from '@/components/iview'
import { routerConfig } from '@/router'

import { Base } from '../base'
import './xiaobian-bot.less'

const BotType = { type1: '1' }

@Component
export default class Apps extends Base {
    stylePrefix = 'xiaobian-bot-';
    result = '';
    bot = {
      [BotType.type1]: {
        subject: '小编',
        verb: '水文章',
        inTheOtherWay: '小编在划水'
      }
    };
    mounted () {
      this.make()
    }
    render () {
      return (
        <Row gutter={10}>
          <Col xs={24} sm={12}>
            <Form nativeOn-submit={(e) => {
              e.preventDefault()
              this.make()
            }} >
              <FormItem label='主体'>
                <Input v-model={this.bot[BotType.type1].subject} />
              </FormItem>
              <FormItem label='事件'>
                <Input v-model={this.bot[BotType.type1].verb} />
              </FormItem>
              <FormItem label='另一种说法'>
                <Input v-model={this.bot[BotType.type1].inTheOtherWay} />
              </FormItem>
              <Button type='primary' on-click={() => {
                this.make()
              }}>生成</Button>
            </Form>
          </Col>
          <Col xs={24} sm={12}>
            <Input v-model={this.result} class={this.getStyleName('result')} type='textarea' size='large' />
          </Col>
        </Row>
      )
    }

    make () {
      const obj = this.bot[BotType.type1]
      const sv = obj.subject + obj.verb
      this.result = [
        `  ${sv}是怎么回事呢？${obj.subject}相信大家都很熟悉， 但是${sv}是怎么回事呢？下面就让小编带大家一起了解吧。 `,
        `  ${sv}，其实就是${obj.inTheOtherWay || sv}了。那么${obj.subject}为什么会${obj.verb}，相信大家都很好奇是怎么回事。大家可能会感到很惊讶，${obj.subject}怎么会${obj.verb}呢？但事实就是这样，小编也感到非常惊讶。`,
        `  那么这就是关于${sv}的事情了，大家有没有觉得很神奇呢？看了今天的内容，大家有什么想法呢？欢迎在评论区告诉小编一起讨论哦。`
      ].join('\r\n')
    }
}
