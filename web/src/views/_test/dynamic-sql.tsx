
import { Component, Vue, Watch } from 'vue-property-decorator'

import { Input, Card, Button, Checkbox, Row, Col, Select, Form, FormItem, Divider, Tabs, TabPane } from '@/components/iview'

import { testApi } from '@/api'
import { myEnum } from '@/config'

import { Base } from '../base'
import DynamicCompDemoModel, { DynamicCompDemo } from './dynamic-comp'
@Component({})
export default class App extends Base {
  $refs: { dynamicComp: DynamicCompDemoModel }
  created () {
    this.init()
  }

  mounted () {
    let dynamicComp = this.$refs.dynamicComp
    dynamicComp.setConfigList([{
      name: 'testStr',
      text: 'testStr',
      queryMatchMode: { show: true, value: myEnum.dynamicCompStringQueryType.模糊 }
    }, {
      name: 'testInt',
      text: 'testInt',
      calcType: myEnum.dynamicSqlCalcType.求和
    }])
    dynamicComp.data = {
      testStr: 'a'
    }
  }

  config: {
    noData?: boolean; name?: string; sql: string,
    type?: string, orderBy?: string
  }[] = []
  result = ''
  params = ''
  querySqlName = 'rs3'
  querySqlOption = JSON.stringify({ pageIndex: 1, pageSize: 2 }, null, '  ')

  init () {
    this.config = [
      {
        name: 'rs1',
        sql: "select :var1+1 as a union select 'aaa' as a"
      },
      {
        type: myEnum.dynamicSqlType.无数据,
        sql: 'set @test=1'
      },
      {
        name: 'rs2',
        sql: 'select 2+@test as c'
      },
      {
        name: 'rs3',
        sql: 'select * from test',
        type: myEnum.dynamicSqlType.列表,
        orderBy: 'id desc'
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
      let dynamicComp = this.$refs.dynamicComp
      let queryArgs = dynamicComp.getAdvData()
      let fields = dynamicComp.getFields()

      let opt = {
        name: this.querySqlName,
        query: {
          ...JSON.parse(this.querySqlOption),
          queryArgs
        },
        fields
      }
      let options: any[] = [opt]

      let rs = await testApi.dynamicSqlExec({
        params: JSON.parse(this.params),
        config: this.config,
        options
      })
      this.result = this.stringify(rs)
    })
  }

  render () {
    return (
      <div>
        <Row gutter={5}>
          <Col span={12}>
            <Tabs>
              <TabPane label='sql'>
                {this.renderSqlSetting()}
              </TabPane>
              <TabPane label='查询参数'>
                <div>
                  <span>sql名字</span>
                  <Input v-model={this.querySqlName} />
                  <Input v-model={this.querySqlOption} type='textarea' rows={3}></Input>
                </div>
                {<DynamicCompDemo ref='dynamicComp' comp advQuery
                  colConfig={{ span: 6 }}
                />}
              </TabPane>
            </Tabs>
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

  renderSqlSetting () {
    return (
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
            <Row gutter={5}>
              <Col span={12}>
                <span>名字</span>
                <Input v-model={ele.name} />
              </Col>
              <Col span={12}>
                <span>类型</span>
                <Select v-model={ele.type} clearable>
                  {myEnum.dynamicSqlType.toArray().map(ele => {
                    return <i-option value={ele.value}>{ele.key}</i-option>
                  })}
                </Select>
              </Col>
              <Col span={24}>
                <span>sql</span>
                <Input v-model={ele.sql} type='textarea' />
              </Col>
              <Col span={24}>
                <Button type='error' on-click={() => {
                  this.config.splice(this.config.indexOf(ele), 1)
                }}>删除</Button>
              </Col>
              <Divider />
            </Row>
          )
        })}
      </Form>
    )
  }
}
