
import { Component, Vue } from 'vue-property-decorator'
import * as QRCode from 'qrcode'

import { Prop } from '@/components/property-decorator'

import { getCompOpts, convClass } from '../utils'
import { MyBase } from '../my-base'

import './my-qrcode.less'
import { Spin } from '../iview'

class MyQrcodeProp {
    @Prop()
    width?: number;
}
@Component({
  extends: MyBase,
  mixins: [getCompOpts(MyQrcodeProp)]
})
class MyQrcode extends Vue<MyQrcodeProp & MyBase> {
    stylePrefix = 'my-qrcode-';
    $refs: { qrCanvas: HTMLDivElement; }

    private qrErr = '';
    private qrDrawing = false;
    async drawQrcode (str: string) {
      this.qrErr = ''
      this.qrDrawing = true
      await QRCode.toCanvas(this.$refs.qrCanvas, str, { width: this.width || 200 }).catch(e => {
        this.qrErr = e.message
      }).finally(() => {
        this.qrDrawing = false
      })
    }

    render () {
      return (
        <div>
          {this.qrDrawing && <Spin size='large' fix />}
          {this.qrErr || <canvas ref='qrCanvas' class={this.getStyleName('qr-box')} />}
        </div>
      )
    }
}

const MyQrcodeView = convClass<MyQrcodeProp>(MyQrcode)
export default MyQrcodeView
export interface IMyQrcode extends MyQrcode { };
