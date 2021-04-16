import { Component, Vue, Watch } from 'vue-property-decorator'

import { Prop } from '@/components/decorator'
import { DynamicCompConfigType, DynamicComp, DynamicCompProp } from '../my-dynamic-comp'
import {
  Table, Page, Row, Col,
  Input, Button, Divider, Card, Icon, Spin
} from '../iview'
import { MyBase } from '../my-base'
import { getCompOpts, convClass, Utils } from '../utils'
import { MyButtonsModel, MyButtons } from '../my-buttons'

export type MyDetailDynamicCompConfigType = DynamicCompConfigType & {
  size?: number
}
class MyDetailProp {
  @Prop({})
  itemConfigs: MyDetailDynamicCompConfigType[];

  @Prop()
  dynamicCompOptions: Omit<DynamicCompProp, 'config'>

  @Prop({})
  buttonConfigs?: MyButtonsModel[];

  @Prop()
  colConfig?: Partial<iView.Col>
}

@Component({
  extends: MyBase,
  mixins: [getCompOpts(MyDetailProp)]
})
export class MyDetailView extends Vue<MyDetailProp & MyBase> {
  stylePrefix = 'my-detail-'

  valid () {
    let rules = Utils.getValidRulesByDynCfg(this.itemConfigs)
    return Utils.valid(this.dynamicCompOptions.data, rules)
  }

  private getColConfig (ele: MyDetailDynamicCompConfigType) {
    let obj = this.colConfig || {
      xs: 24,
      md: 12,
      lg: 6,
      xl: 4
    }
    if (ele.size && ele.size > 1) {
      for (let key in obj) {
        let val = obj[key] * ele.size
        if (val > 24) val = 24
        obj[key] = val
      }
    }
    return obj
  }

  protected render () {
    return (
      <div>
        {this.renderBtns()}
        {this.renderItem()}
      </div>
    )
  }

  protected renderBtns () {
    return (
      this.buttonConfigs && this.buttonConfigs.length && <MyButtons value={this.buttonConfigs} />
    )
  }

  protected renderItem () {
    return (
      <Row class={this.getStyleName('item-main')}>
        {this.itemConfigs.map(ele => {
          let colConfig = this.getColConfig(ele)
          return (
            <Col props={colConfig}>
              <DynamicComp class={this.getStyleName('item')}
                config={ele}
                data={this.dynamicCompOptions.data}
                readonlyType='disabled'
                showText
                props={this.dynamicCompOptions}
              />
            </Col>
          )
        })}
      </Row>
    )
  }
}

export const MyDetail = convClass<MyDetailProp>(MyDetailView)
