import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop } from '@/components/decorator'

import { Spin, Button, Card } from '../iview'
import { MyBase } from '../my-base'
import { cls } from '../style'

class MyLoadProp {
  @Prop()
  loadFn: () => Promise<any> | any;

  @Prop()
  afterLoad?: () => Promise<any> | any;

  @Prop()
  renderFn: (data: any) => any;

  @Prop()
  width?: number;

  @Prop({
    default: 200
  })
  height?: number;

  @Prop()
  notLoadOnMounted?: boolean;

  @Prop()
  errMsgFn?: (e) => string;

  @Prop()
  outLoading?: boolean;
}
@Component({
  extends: MyBase,
  props: MyLoadProp
})
export class MyLoad extends Vue<MyLoadProp, MyBase> {
  stylePrefix = 'my-load-';

  loading = false;
  result = {
    success: false,
    msg: '准备加载',
    data: null
  };

  protected mounted () {
    if (!this.notLoadOnMounted) { this.loadData() }
  }

  async loadData () {
    this.loading = true
    try {
      this.result.data = await this.loadFn()
      this.result.success = true
      await this.$utils.wait()
      this.afterLoad && await this.afterLoad()
    } catch (e) {
      console.error(e)
      this.result.success = false
      this.result.msg = (this.errMsgFn && this.errMsgFn(e)) || e.message
    } finally {
      this.loading = false
    }
  }

  protected render () {
    if (!this.result.success) {
      return (
        <div class={this.getStyleName('root')}>
          <Card class={cls.center} style={{ height: this.height ? this.height + 'px' : null, width: this.width ? this.width + 'px' : null }}>
            {this.loading ? <Spin size='large' fix />
              : <div class={this.getStyleName('content').concat(cls.center)}>
                {this.result.msg}
                <Button class={this.getStyleName('retry-btn')} on-click={this.loadData}>重试</Button>
              </div>
            }
          </Card>
        </div>
      )
    }

    return (
      <div>
        {this.outLoading && <Spin size='large' fix />}
        {this.renderFn(this.result.data)}
      </div>
    )
  }
}
