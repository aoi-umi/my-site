import { Component, Vue, Watch } from 'vue-property-decorator'

import { Prop } from '@/components/property-decorator'
import { Button, Row, Col, Modal } from '../iview'
import { convClass, getCompOpts } from '../utils'
import { MyBase } from '../my-base'

import './style.less'

type BtnType = {
  text: string;
  type?: string;
  loading?: boolean;
  onClick?: (ele: BtnType, idx: number) => any;
};

class MyConfirmProp {
  @Prop()
  title?: string;

  @Prop({ default: false })
  loading?: boolean;

  @Prop()
  btnList?: BtnType[];

  @Prop()
  ok?: (ele: BtnType) => void | Promise<void>;

  @Prop()
  cancel?: (ele: BtnType) => void;
}
@Component({
  extends: MyBase,
  mixins: [getCompOpts(MyConfirmProp)]
})
class MyConfirm extends Vue<MyConfirmProp & MyBase> {
  stylePrefix = 'my-confirm-';

  private get innerBtnList () {
    return this.btnList || [{
      text: '取消',
      onClick: (e) => {
        this.cancel && this.cancel(e)
      }
    }, {
      text: '确认',
      type: 'primary',
      onClick: async (e, idx) => {
        if (this.ok) {
          if (this.loading) {
            e.loading = true
            this.$forceUpdate()
          }
          await this.ok(e)
          if (this.loading) {
            e.loading = false
            this.$forceUpdate()
          }
        }
      }
    }]
  };

  renderBtn () {
    const btnList = this.innerBtnList

    return (
      <Row gutter={5} type='flex' justify='end'>
        {btnList.map((ele, idx) => {
          if (!ele.loading) { ele.loading = false }
          return (
            <Col>
              <Button type={ele.type as any} on-click={() => {
                ele.onClick && ele.onClick(ele, idx)
              }} loading={ele.loading}>{ele.text}</Button>
            </Col>
          )
        })}
      </Row>
    )
  }
  render () {
    return (
      <div>
        <h2>{this.title || ''}</h2>
        <div class={this.getStyleName('content-box')}>
          {this.$slots.default}
        </div>
        {this.renderBtn()}
      </div>
    )
  }
}

const MyConfirmView = convClass<MyConfirmProp>(MyConfirm)
export default MyConfirmView

export class MyConfirmModalProp {
  @Prop()
  title?: string;

  @Prop()
  confirm?: () => void | Promise<void>;
}

@Component({
  extends: MyBase,
  mixins: [getCompOpts(MyConfirmModalProp)]
})
export class MyConfirmModal extends Vue<MyConfirmModalProp & MyBase> {
  show = false
  toggle (show?: boolean) {
    this.show = typeof show === 'boolean' ? show : !this.show
  }
  render () {
    return (
      <Modal v-model={this.show} footer-hide>
        <MyConfirmView
          props={this.$props}
          loading={true}
          cancel={() => {
            this.toggle(false)
          }}
          ok={async () => {
            try {
              this.confirm && await this.confirm()
              this.toggle(false)
            } catch (e) {
              this.$Message.error(e.message)
            } finally {
            }
          }}>
          {this.$slots.default}
        </MyConfirmView>
      </Modal>
    )
  }
}

export const MyConfirmModalView = convClass<MyConfirmProp>(MyConfirmModal)
