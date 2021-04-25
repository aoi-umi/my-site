import { Watch } from 'vue-property-decorator'

import { Vue, Component, Prop } from '@/components/decorator'

import { Icon, Button } from '../iview'
import { MyBase } from '../my-base'

class MyNumberProp {
    @Prop({
      default: 0
    })
    value?: number;

    @Prop({
      default: 1
    })
    step?: number;

    @Prop()
    min?: number;

    @Prop()
    max?: number;
}
@Component({
  extends: MyBase,
  props: MyNumberProp
})
export class MyNumber extends Vue<MyNumberProp, MyBase> {
    stylePrefix = 'my-number-';

    @Watch('value')
    protected watchValue (newValue) {
      this.v = newValue
    }

    private v = this.value;

    @Watch('v')
    private watchV (newValue) {
      this.$emit('input', newValue)
    }

    created () {
      this.watchValue(this.value)
    }

    private changeNum (add: boolean) {
      let v = this.v + (add ? this.step * 1 : -1)
      if (!isNaN(this.min) && v < this.min) { v = this.min }
      if (!isNaN(this.max) && v > this.max) { v = this.max }
      this.v = v
    }

    render () {
      return (
        <div class={this.getStyleName('main')}>
          <Button disabled={!isNaN(this.min) && this.v <= this.min} class={this.getStyleName('sub')} icon='md-remove' on-click={() => {
            this.changeNum(false)
          }} />
          <span class={this.getStyleName('num')}>{this.v}</span>
          <Button disabled={!isNaN(this.max) && this.v >= this.max} class={this.getStyleName('add')} icon='md-add' on-click={() => {
            this.changeNum(true)
          }} />
        </div>
      )
    }
}

