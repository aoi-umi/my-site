import { Component, Vue, Watch } from 'vue-property-decorator'

import { Prop } from '@/components/decorator'

import { convClass, getCompOpts } from '../utils'
import { Icon, Button, Dropdown, DropdownMenu, DropdownItem } from '../iview'
import { MyBase } from '../my-base'
import { MyButtonsModel, MyButtonsGroup } from './model'

class MyButtonsProp {
  @Prop()
  value: MyButtonsModel[];

  @Prop()
  type?: string;
}
@Component({
  extends: MyBase,
  mixins: [getCompOpts(MyButtonsProp)]
})
class MyButtonsView extends Vue<MyButtonsProp & MyBase> {
  stylePrefix = 'my-buttons-'
  @Watch('value', {
    immediate: true,
    deep: true
  })
  private watchValue (val) {
    this.val = MyButtonsModel.createGroup(val)
  }
  private val: MyButtonsGroup[] = []
  protected render () {
    return (
      <div class={this.getStyleName('root')}>
        {this.val.map(ele => {
          return this.renderBtnGroup(ele)
        })}
      </div>
    )
  }

  protected renderBtnGroup (grp: MyButtonsGroup) {
    if (grp.child.length == 1) return this.renderBtn(grp.child[0])
    return (
      <Dropdown on-on-click={(name) => this.groupClickHandler(name)}>
        <Button type={this.type as any}>
          {grp.group.text}
          <Icon type='ios-arrow-down'></Icon>
        </Button>
        <DropdownMenu slot='list'>
          {grp.child.map(c => this.renderBtn(c, true))}
        </DropdownMenu>
      </Dropdown>
    )
  }

  protected renderBtn (btn: MyButtonsModel, group?: boolean) {
    if (group) return <DropdownItem name={btn.name}>{btn.text}</DropdownItem>
    return <Button
      type={btn.type || this.type as any}
      on-click={() => this.clickHandler(btn)}
      disabled={btn.disabled && btn.disabled()}
    >{btn.text}</Button>
  }

  private groupClickHandler (name) {
    let match = this.value.find(ele => ele.name === name)
    if (match) { this.clickHandler(match) }
  }

  private clickHandler (btn: MyButtonsModel) {
    if (!btn.click) {
      this.$Message.warning('未实现点击事件')
      return
    }
    btn.click(btn)
  }
}

export const MyButtons = convClass<MyButtonsProp>(MyButtonsView)
