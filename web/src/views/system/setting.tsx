import { Component, Vue, Watch } from 'vue-property-decorator'

import { testApi } from '@/api'
import { MyLoad } from '@/components/my-load'
import { Form, FormItem, Input, RadioGroup, Radio, DatePicker, Button } from '@/components/iview'

import { Base } from '../base'
import { myEnum } from '@/config'

type DetailType = {
    _id: string;
    signUpType: number;
    signUpFrom: Date;
    signUpTo: Date;
    operatorId: string;
};
@Component
export default class Setting extends Base {
    private detail: DetailType;
    private signUpTime = [];

    render () {
      return (
        <MyLoad
          loadFn={async () => {
            const rs: DetailType = await testApi.settingDetailQuery()
            if (rs.signUpFrom) { rs.signUpFrom = new Date(rs.signUpFrom) }
            if (rs.signUpTo) { rs.signUpTo = new Date(rs.signUpTo) }
            this.signUpTime = [rs.signUpFrom, rs.signUpTo]
            this.detail = rs
            return rs
          }}
          renderFn={() => {
            return this.renderFn()
          }}
        />
      )
    }

    private renderFn () {
      const { detail } = this
      return (
        <div style={{ minHeight: '600px' }}>
          <Form label-position='top'>
            <FormItem label='开放注册' >
              <RadioGroup v-model={detail.signUpType}>
                {myEnum.settingSignUpType.toArray().map(ele => {
                  return <Radio label={ele.value}>{ele.key}</Radio>
                })}
              </RadioGroup>
            </FormItem>
            <FormItem label='限定时间' v-show={[myEnum.settingSignUpType.限时关闭, myEnum.settingSignUpType.限时开放].includes(detail.signUpType)}>
              <DatePicker type='datetimerange' v-model={this.signUpTime} style={{ width: '300px' }} />
            </FormItem>
          </Form>
          <Button type='primary' on-click={() => {
            this.operateHandler('保存', async () => {
              await testApi.settingSave({
                ...detail,
                signUpFrom: this.signUpTime[0],
                signUpTo: this.signUpTime[1]
              })
            })
          }}>保存</Button>
        </div>
      )
    }
}
