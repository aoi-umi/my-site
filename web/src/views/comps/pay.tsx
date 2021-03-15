import { Component, Vue, Watch } from 'vue-property-decorator'

import { Prop } from '@/components/property-decorator'
import { myEnum } from '@/config'
import { convClass, getCompOpts } from '@/components/utils'
import { RadioGroup, Radio, Button, Modal, Spin } from '@/components/iview'

import { Base } from '../base'

import './pay.less'
import { MyQrcode, IMyQrcode } from '@/components/my-qrcode'
import { testSocket } from '@/api'
import { routerConfig } from '@/router'

const ShowType = {
  网页: 'web',
  二维码: 'qrcode'
}

class PayProp {
  @Prop({
    default: myEnum.assetSourceType.支付宝
  })
  payType?: number;

  @Prop({
    required: true
  })
  payFn: () => Promise<{ orderNo: string, url: string }>;
}
@Component({
  extends: Base,
  mixins: [getCompOpts(PayProp)]
})
export class Pay extends Vue<PayProp & Base> {
  stylePrefix = 'comp-pay-';

  $refs: { qrcode: IMyQrcode; }
  isShow = false;

  private typeList: { key: string; value: any, checked?: boolean }[] = [];
  protected created () {
    this.typeList = myEnum.assetSourceType.toArray().filter(ele => ele.value === myEnum.assetSourceType.支付宝).map(ele => {
      ele['checked'] = false
      return ele
    })
    testSocket.bindPayCallback((data) => {
      if (data.orderNo === this.orderNo) {
        this.toggle(false)
      }
      this.$Notice.info({
        title: '支付成功',
        render: () => {
          return (
            <span>
              订单{data.orderNo}支付成功
              <a on-click={() => {
                this.$router.push(routerConfig.payMgt.path)
              }}>查看</a>
            </span>
          )
        }
      })
    })
  }

  private creatingPay = false;
  private paying = false;
  private orderNo = '';
  private pay () {
    this.creatingPay = true
    this.operateHandler('调起支付', async () => {
      const rs = await this.payFn()
      if (this.payType === myEnum.assetSourceType.微信) {
        this.payBoxShow = true
        this.showType = ShowType.二维码
        this.showPayContent(rs.url)
      } else {
        window.open(rs.url, '_blank')
      }
      this.orderNo = rs.orderNo
      testSocket.pay({ orderNo: rs.orderNo })
    }, {
      noSuccessHandler: true
    }).finally(() => {
      this.creatingPay = false
    })
    this.paying = true
  }
  private showType = ShowType.网页;
  private showPayContent (url) {
    if (this.showType === ShowType.二维码) { this.$refs.qrcode.drawQrcode(url) }
  }

  private payBoxShow = false;
  toggle (val?: boolean) {
    this.isShow = val !== void 0 ? val : !this.isShow
    this.orderNo = ''
  }
  protected render () {
    return (
      <Modal v-model={this.isShow} footer-hide on-on-visible-change={() => {
        this.paying = false
      }}>
        <div class={this.getStyleName('root')}>
          {this.$slots.default}
          <Modal v-model={this.payBoxShow} footer-hide mask-closable={false}>
            <div class={this.getStyleName('pay-content')}>
              <MyQrcode ref='qrcode' v-show={this.showType === ShowType.二维码} />
            </div>
          </Modal>
          <RadioGroup v-model={this.payType}>
            {this.typeList.map(ele => {
              return <Radio label={ele.value}>{ele.key}</Radio>
            })}
          </RadioGroup>
          <div class={this.getStyleName('submit-btn')}>
            {!this.paying ? <Button type='primary' loading={this.creatingPay} on-click={() => {
              this.pay()
            }}>支付</Button> : <span>支付中</span>}
          </div>
        </div>
      </Modal>
    )
  }
}

export const PayView = convClass<PayProp>(Pay)
