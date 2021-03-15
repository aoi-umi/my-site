import { Component, Vue, Watch } from 'vue-property-decorator'
import * as parseJson from 'parse-json'

import { Card, Row, Col, Form, Button, Input, ButtonGroup } from '@/components/iview'
import { routerConfig } from '@/router'
import { convert } from '@/helpers'

import { Base } from '../base'
import './json.less'

@Component
export default class Apps extends Base {
  stylePrefix = 'json-';
  input = '';
  output = '';
  mounted () {
  }

  render () {
    return (
      <Row gutter={10}>
        <Col xs={24} sm={12}>
          <Input v-model={this.input} class={this.getStyleName('input')} type='textarea' size='large' />
          <div class={this.getStyleName('op')} >
            <ButtonGroup>
              <Button on-click={this.beautify}>校验JSON</Button>
              <Button on-click={this.xml2json}>xml转json</Button>
            </ButtonGroup>
          </div>
        </Col>
        <Col xs={24} sm={12}>
          <pre class={this.getStyleName('output')} >
            {this.output}
          </pre>
        </Col>
      </Row>
    )
  }
  handler (fn: (value:string)=>any) {
    if (this.input) {
      try {
        this.output = fn(this.input)
      } catch (e) {
        this.output = e.message
      }
    }
  }

  stringify (value: Object) {
    return JSON.stringify(value, null, '  ')
  }

  beautify () {
    this.handler((value) => {
      return this.stringify(parseJson(value))
    })
  }

  xml2json () {
    this.handler((value) => {
      let rs = convert.Xml.xml2json(value)
      return this.stringify(rs)
    })
  }
}
