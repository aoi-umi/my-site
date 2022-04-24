import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop } from '@/components/decorator'

export type OperateDataType = {
  text: string
  to?: string
  fn?: () => any
  type?: string
  tag?: string
}

export class OperateButtonProp {
  @Prop()
  data: OperateDataType
}

@Component({
  props: OperateButtonProp,
})
export class OperateButton extends Vue<OperateButtonProp> {
  private renderItem(h) {
    let tag = this.data.tag || 'div'
    let data = {
      props: {
        type: this.data.type,
      },
      style: 'display: inline; cursor: pointer',
      on: {
        click: () => {
          this.data.fn && this.data.fn()
        },
      },
    }
    return h(tag, data, this.data.text)
  }

  render(h) {
    if (this.data.to) {
      return <router-link to={this.data.to}>{this.renderItem(h)}</router-link>
    }
    return this.renderItem(h)
  }
}
