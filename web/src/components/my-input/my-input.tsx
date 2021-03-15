import { Component, Vue, Watch } from 'vue-property-decorator'

import { Prop } from '@/components/property-decorator'

import { convClass, getCompOpts } from '../utils'
import { Option, Select, Input } from '../iview'
import { MyBase } from '../my-base'

export class MyInputBaseProp {
  @Prop()
  value?: string;

  @Prop()
  placeholder?: string;
}
@Component({
  extends: MyBase,
  mixins: [getCompOpts(MyInputBaseProp)]
})
export class MyInputBase extends Vue<MyInputBaseProp & MyBase> {
  protected currentValue = this.value || '';
  protected disableEmitChange = false;

  @Watch('value')
  watchValue (val) {
    if (this.currentValue !== val) {
      this.disableEmitChange = true
    }
    this.currentValue = val
  }

  @Watch('currentValue')
  watchCurrentValue (val) {
    this.watchCurrentValueHandler && this.watchCurrentValueHandler(val)
    this.$emit('input', val)
    if (this.disableEmitChange) {
      this.disableEmitChange = false
      return
    }
    this.$emit('on-change', val)
  }

  protected watchCurrentValueHandler (val) { };
}

class MyInputProp extends MyInputBaseProp {
  @Prop()
  label?: string;

  @Prop({
    default: () => []
  })
  data: any[];

  @Prop()
  disabled?: boolean;

  @Prop()
  clearable?: boolean;

  @Prop()
  size?: '' | 'small' | 'large' | 'default';

  @Prop()
  icon?: string;

  @Prop()
  placement?: 'bottom' | 'top' | 'top-start' | 'bottom-start' | 'top-end' | 'bottom-end';

  @Prop()
  transfer?: boolean;

  @Prop()
  name?: string;

  @Prop()
  elementId?: string;

  @Prop()
  loading?: boolean;
}
@Component({
  extends: MyInputBase,
  mixins: [getCompOpts(MyInputProp)]
})
class MyInput extends Vue<MyInputProp & MyInputBase> {
  $refs: { select: any, input: any };

  get inputIcon () {
    let icon = ''
    if (this.clearable && this.currentValue) {
      icon = 'ios-close'
    } else if (this.icon) {
      icon = this.icon
    }
    return icon
  }
  get filteredData () {
    // if (this.filterMethod) {
    //     return this.data.filter(item => this.filterMethod(this.currentValue, item));
    // } else {
    return this.data
    // }
  }

  watchCurrentValueHandler (val) {
    this.$refs.select.setQuery(val)
  }

  private firstFocus = true;
  private handleInputChange (e) {
    const val = e.target.value && e.target.value.trim()
    this.$emit('on-search', val)
  }
  private handleChange (val) {
    if (val === undefined || val === null) return
    // this.currentValue = val;
    this.$refs.input['blur']()
    this.$emit('on-select', val)
  }
  private handleFocus (event) {
    if (this.firstFocus) {
      this.firstFocus = false
      this.$emit('on-search', '')
    }
    this.$emit('on-focus', event)
  }
  private handleBlur (event) {
    this.$emit('on-blur', event)
  }
  private handleClear () {
    if (!this.clearable) return
    if (this.currentValue !== '') { this.$emit('on-search', '') }
    this.currentValue = ''
    this.$refs.select['reset']()
    this.$emit('on-clear')
  }
  protected render () {
    return (
      <Select
        ref='select'
        class='ivu-auto-complete'
        label={this.label}
        disabled={this.disabled}
        clearable={this.clearable}
        // placeholder={this.placeholder}
        size={this.size}
        placement={this.placement}
        // value={this.currentValue}
        // filterable
        // remote
        auto-complete
        // remote-method={this.remoteMethod}
        on-on-change={this.handleChange}
        transfer={this.transfer}
        loading={this.loading}>
        {this.$slots.input ||
          <Input
            element-id={this.elementId}
            ref='input'
            slot='input'
            v-model={this.currentValue}
            name={this.name}
            placeholder={this.placeholder}
            disabled={this.disabled}
            size={this.size}
            icon={this.inputIcon}
            on-on-click={this.handleClear}
            on-on-focus={this.handleFocus}
            on-on-change={this.handleInputChange}
            on-on-blur={this.handleBlur} />
        }
        {this.$slots.default ||
          this.filteredData.map(item => {
            return <Option value={item} key={item}>{item}</Option>
          })
        }
      </Select >
    )
  }
}

const MyInputView = convClass<MyInputProp>(MyInput)
export default MyInputView
