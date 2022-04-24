import {} from 'vue-property-decorator'
import * as QRCode from 'qrcode'

import { Component, Vue, Prop } from '@/components/decorator'

import { MyBase } from '../my-base'
import { Spin } from '../iview'

class MyQrcodeProp {
  @Prop()
  width?: number

  @Prop()
  text?: string

  @Prop()
  showText?: boolean
}
@Component({
  extends: MyBase,
  props: MyQrcodeProp,
})
export class MyQrcode extends Vue<MyQrcodeProp, MyBase> {
  stylePrefix = 'my-qrcode-'
  $refs: { qrCanvas: HTMLDivElement }

  mounted() {
    if (this.text) {
      this.drawQrcode(this.text)
    }
  }

  private qrErr = ''
  private qrDrawing = false
  private currText = ''
  async drawQrcode(str: string) {
    this.qrErr = ''
    this.qrDrawing = true
    this.currText = str
    await QRCode.toCanvas(this.$refs.qrCanvas, str, {
      width: this.width || 200,
    })
      .catch((e) => {
        this.qrErr = e.message
      })
      .finally(() => {
        this.qrDrawing = false
      })
  }

  render() {
    return (
      <div class={this.getStyleName('root')}>
        {this.qrDrawing && <Spin size="large" fix />}
        <div class={this.getStyleName('main')}>
          {this.qrErr || (
            <canvas ref="qrCanvas" class={this.getStyleName('qr-box')} />
          )}
          {this.showText && <div>{this.currText}</div>}
        </div>
      </div>
    )
  }
}
