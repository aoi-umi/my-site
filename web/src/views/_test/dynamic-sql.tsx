
import { Component, Vue, Watch } from 'vue-property-decorator'

import { Input, Card, Button, Checkbox, Row, Col, Select, Option, Form, FormItem, Divider } from '@/components/iview'

import { MyList } from '@/components/my-list'
import { DynamicComp, DynamicCompType, DynamicCompConfigType } from '@/components/my-dynamic-comp'
import { Base } from '../base'
import { testApi } from '@/api'

@Component({})
export default class App extends Base {
  created () {
    this.init()
  }

  config: {
    noData?: boolean; name?: string; sql: string,
    type?: string, options?: any
  }[] = []
  result = ''
  params = ''

  init () {
    this.config = [
      {
        name: 'rs1',
        sql: "select :var1+1 as a union select 'aaa' as a"
      },
      {
        noData: true,
        sql: 'set @test=1'
      },
      {
        name: 'rs2',
        sql: 'select 2+@test as c'
      },
      {
        name: 'rs3',
        sql: 'select * from test',
        type: 'list',
        options: {
          orderBy: 'id desc',
          pageIndex: 1,
          pageSize: 2
        }
      }
    ]
    this.params = this.stringify({
      var1: 1
    })
  }

  stringify (val) {
    return JSON.stringify(val, null, '  ')
  }

  test () {
    this.operateHandler('', async () => {
      let rs = await testApi.dynamicSqlExec({
        params: JSON.parse(this.params),
        config: this.config
      })
      this.result = this.stringify(rs)
    })
  }

  render () {
    return (
      <div>
        <Row gutter={5}>
          <Col span={12}>
            <Form label-position='right' label-width={60}>
              <FormItem label='参数'>
                <Input type='textarea' v-model={this.params} rows={4}>
                </Input>
              </FormItem>
              <Button on-click={() => {
                this.config.push({
                  name: '',
                  sql: ''
                })
              }}>添加</Button>
              {this.config.map(ele => {
                return (
                  <div>
                    <FormItem label='名字'>
                      <Input v-model={ele.name} />
                    </FormItem>
                    <FormItem label='无数据'>
                      <Checkbox v-model={ele.noData} />
                    </FormItem>
                    <FormItem label='sql'>
                      <Input v-model={ele.sql} type='textarea' />
                    </FormItem>
                    <Divider />
                  </div>
                )
              })}
            </Form>
          </Col>
          <Col span={12}>
            <Button on-click={this.test}>测试</Button>
            <Input type='textarea' v-model={this.result} rows={20}>
            </Input>
          </Col>
        </Row>
      </div>
    )
  }
}
