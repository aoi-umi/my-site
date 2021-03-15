import { Component, Vue, Watch } from 'vue-property-decorator'

import { convClass, getCompOpts } from '@/components/utils'
import { Prop } from '@/components/property-decorator'

import {
  Input,
  Select,
  Checkbox,
  InputNumber,
  DatePicker,
  TimePicker,
  Tooltip
} from '../iview'
import '../style'
import { MyBase } from '../my-base'
import './my-dynamic-comp.less'

export const DynamicCompType = {
  输入框: 'input',
  数字输入框: 'input-number',
  选择器: 'select',
  多选框: 'checkbox',
  日期: 'date',
  时间: 'time',
  日期时间: 'datetime'
}

export const DynamicCompStringQueryType = {
  模糊: 'like',
  左模糊: 'left-like',
  右模糊: 'right-like',
  等于: 'eq'
}

export const DynamicCompNumQueryType = {
  大于: '>',
  大于等于: '>=',
  小于: '<',
  小于等于: '<=',
  等于: '=',
  不等于: '!='
}

type SelectOptionType = { label: string; value: any };

export type DynamicCompConfigType = {
  name: string;
  text: string;
  editable?: boolean
  remark?: string;
  // 组件类型
  type?: string;
  // 是否区间
  isRange?: boolean;
  rangeSeparator?: string;
  options?: string | { [key: string]: number | string }
  | SelectOptionType[] | ((query: string) => Promise<SelectOptionType[]>);
  append?: any
  required?: boolean
};
export class DynamicCompProp {
  @Prop({
    required: true
  })
  config: DynamicCompConfigType;

  @Prop({
    required: true
  })
  data: any;

  @Prop()
  showText?: boolean;

  @Prop({
    default: true
  })
  editable?: boolean;

  @Prop({
    default: 'text'
  })
  readonlyType?: 'disabled' | 'text'

  @Prop()
  extraValue?: Object

  @Prop()
  dynamicConfig?: (opt: {
    config: DynamicCompConfigType,
    name: string,
    value: any,
    data: any,
  }) => any
}

@Component({
  extends: MyBase,
  mixins: [getCompOpts(DynamicCompProp)]
})
class DynamicCompModel extends Vue<DynamicCompProp & MyBase> {
  stylePrefix = 'my-dynamic-comp-';
  created () {
  }
  render () {
    return (
      <Tooltip class={this.getStyleName('root')} disabled={!this.toolTips}>
        {this.showText &&
          <span class={this.getStyleName('text').concat([this.actuallyRequired && 'required'])}>
            {this.actualOption.config.text}
          </span>
        }
        <div class={this.getStyleName('container').concat([
          !this.showText && this.actuallyRequired && 'required'
        ])}>{this.renderComp()}</div>
        <div slot='content' style='white-space: normal;word-break: break-all;'>
          {this.toolTips}
        </div>
      </Tooltip>
    )
  }

  private loading = false

  private get selectOptions () {
    let { config, data } = this.getActualOption()
    let val
    if (typeof config.options === 'function') {
      val = this.remoteSelectOptions
    } else if (typeof config.options === 'string') {
      val = this.extraValue[config.options]
    } else { val = config.options }

    if (val && !(val instanceof Array)) {
      val = Object.entries(val).map(ele => {
        return {
          label: ele[0],
          value: ele[1]
        }
      })
    }
    return val as SelectOptionType[]
  }

  private remoteSelectOptions: SelectOptionType[] = []

  private get actuallyEditable () {
    return this.actualOption.editable
  }
  private get actuallyRequired () {
    return this.actualOption.config.required
  }

  private get isDate () {
    let { config } = this.getActualOption()
    return [DynamicCompType.日期, DynamicCompType.日期时间].includes(config.type)
  }

  private get actualOption () {
    return this.getActualOption()
  }
  // 获取实际的参数
  private getActualOption () {
    let { config, data } = this
    let cfg
    if (this.dynamicConfig) {
      cfg = this.dynamicConfig({
        config, name: config.name,
        value: data[config.name],
        data
      })
    }
    let actConfig = config
    if (cfg) {
      actConfig = {
        ...actConfig,
        ...cfg
      }
    }

    let rangeSeparator = config.rangeSeparator || '-'
    return {
      data,
      config: actConfig,
      editable: this.editable && actConfig.editable,
      rangeSeparator
    }
  }

  private get toolTips () {
    return this.getReadonlyValue()
  }
  private getReadonlyValue () {
    let { data, config, rangeSeparator } = this.getActualOption()

    let val = data[config.name]
    let showValue = val
    if (config.type === DynamicCompType.选择器) {
      let match = this.selectOptions.find(ele => ele.value == val)
      if (match) showValue = match.label
    }
    if (this.isDate) {
      let fmt = {
        [DynamicCompType.日期]: 'date',
        [DynamicCompType.日期时间]: 'datetime'
      }[config.type]
      showValue = ''
      if (val) {
        let list = val instanceof Array ? val : [val]
        showValue = list.map(ele => this.$utils.dateFormat(ele, fmt))
      }
    }
    if (showValue instanceof Array) { showValue = showValue.join(` ${rangeSeparator} `) }
    return showValue
  }

  renderText () {
    return this.getReadonlyValue()
  }
  renderComp () {
    let { data, config, rangeSeparator } = this.getActualOption()

    if (config.type === DynamicCompType.多选框) {
      return <Checkbox v-model={data[config.name]} disabled={!this.actuallyEditable} />
    }

    if (this.readonlyType === 'text' && !this.actuallyEditable) {
      return this.renderText()
    }

    if (config.type === DynamicCompType.选择器) {
      let isFn = typeof config.options === 'function'
      let method: any = !isFn ? null : (query) => {
        this.setSelectOption({
          query
        })
      }
      return (
        <Select
          clearable transfer filterable
          v-model={data[config.name]} placeholder={config.remark}
          loading={this.loading} remote-method={method} disabled={!this.actuallyEditable}
        >
          {this.selectOptions?.map((ele) => {
            return <i-option value={ele.value} key={ele.label}>{ele.label}</i-option>
          })}
        </Select>
      )
    }

    if (this.isDate) {
      let type = {
        [DynamicCompType.日期]: 'date',
        [DynamicCompType.日期时间]: 'datetime'
      }[config.type] as any
      if (config.isRange) type += 'range'
      return <DatePicker
        clearable transfer
        type={type} v-model={data[config.name]} disabled={!this.actuallyEditable}
        placeholder={config.remark} />
    }

    if (config.type === DynamicCompType.时间) {
      let type = 'time' as any
      if (config.isRange) type += 'range'
      return (
        <TimePicker
          transfer
          disabled={!this.actuallyEditable}
          v-model={data[config.name]}
          type={type}
          range-separator={rangeSeparator}
          placeholder={config.remark}
        />
      )
    }

    if (config.type === DynamicCompType.数字输入框) {
      return (
        <InputNumber
          v-model={data[config.name]}
          disabled={!this.actuallyEditable}
          controls-position='right'
          placeholder={config.remark}
        />
      )
    }

    return <Input
      v-model={data[config.name]}
      disabled={!this.actuallyEditable}
      placeholder={config.remark}
      clearable
    >
      {config.append && <span slot='append'>{config.append}</span>}
    </Input>
  }

  setSelectOption (opt: { query?}) {
    let { query } = opt
    let { config, data } = this.getActualOption()
    let rs = (config.options as any)(query)
    this.loading = true
    let value
    rs.then(v => {
      value = v
    }).finally(() => {
      this.remoteSelectOptions = value || []
      this.loading = false
    })
  }
}

export const DynamicComp = convClass<DynamicCompProp>(DynamicCompModel)
