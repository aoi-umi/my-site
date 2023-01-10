import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop } from '@/components/decorator'

import { Icon } from '../iview'
import { MyBase } from '../my-base'

class MyImgProp {
  @Prop()
  src?: string

  @Prop()
  alt?: string

  @Prop()
  failImg?: string

  // @Prop()
  // vLazy?: string;
}
@Component({
  extends: MyBase,
  props: MyImgProp,
})
export class MyImg extends Vue<MyImgProp, MyBase> {
  @Watch('src')
  private watchSrc(newVal) {
    this.isLoadSuccess = !!newVal
  }

  $refs: { img: HTMLElement }
  private isLoadSuccess = !!this.src
  stylePrefix = 'my-img-'

  handleError(e) {
    this.isLoadSuccess = false
  }
  private isFail = false
  render() {
    this.isFail = this.src && !this.isLoadSuccess
    const rootCls = this.getStyleName('root')
    if (this.isFail && !this.failImg) {
      rootCls['fail-icon'] = true
    }
    return (
      <div class={rootCls}>
        {!this.src ? (
          <Icon type="md-image" size={40} class={this.getStyleName('icon')} />
        ) : (
          <img
            ref="img"
            class={this.getStyleName('image')}
            v-show={this.isLoadSuccess}
            on-error={this.handleError}
            src={this.src}
            alt={this.alt}
          />
        )}
        {this.isFail &&
          (this.failImg ? (
            <img src={this.failImg} alt={this.alt} />
          ) : (
            <Icon type="md-alert" size={40} class={this.getStyleName('icon')} />
          ))}
      </div>
    )
  }
}
