import { Component, Vue, Watch } from 'vue-property-decorator'

import { convClass, getCompOpts, Utils } from '@/components/utils'
import { Prop } from '@/components/decorator'
import { myEnum } from '@/config'
const { dynamicCompType, dynamicCompNumQueryType, dynamicCompStringQueryType } = myEnum

import {
  Input,
  Select,
  Checkbox,
  InputNumber,
  DatePicker,
  TimePicker,
  Tooltip
} from '../iview'
import { MyBase } from '../my-base'

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
  optionType?: string;
  actOptions?: string | { [key: string]: number | string }
  | SelectOptionType[] | ((query: string) => Promise<SelectOptionType[]>);
  options?: string
  append?: any
  required?: boolean
  disabled?: boolean
  queryMode?: {
    show?: boolean,
    value?: string
  },

  calcType?: string
};

type DynamicCompPropType = {
  [key: string]: {
    event?: any
  }
}
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
  compProp?: DynamicCompPropType;

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
    let options = config.actOptions
    if (typeof options === 'function') {
      val = this.remoteSelectOptions
    } else if (typeof options === 'string') {
      val = this.extraValue[options]
    } else { val = options }

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
    return [dynamicCompType.日期, dynamicCompType.日期时间].includes(config.type)
  }

  private get queryMatchMode () {
    let { config } = this.getActualOption()
    return config.queryMode
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
    let eve = this.compProp?.[actConfig.name]?.event
    let event = {}
    if (eve) {
      for (let key in eve) {
        event[Utils.stringToHyphen(key)] = eve[key]
      }
    }
    return {
      data,
      config: actConfig,
      editable: this.editable && actConfig.editable,
      rangeSeparator,
      event
    }
  }

  private get toolTips () {
    return this.getReadonlyValue()
  }
  private getReadonlyValue () {
    let { data, config, rangeSeparator } = this.getActualOption()

    let val = data[config.name]
    let showValue = val
    if (config.type === dynamicCompType.选择器) {
      let match = this.selectOptions?.find(ele => ele.value == val)
      if (match) showValue = match.label
    } else if (config.type === dynamicCompType.多选框) {
      showValue = val ? 'True' : 'False'
    } else if (this.isDate) {
      let fmt = {
        [dynamicCompType.日期]: 'date',
        [dynamicCompType.日期时间]: 'datetime'
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

  private renderOption (option) {
    return option?.map((ele) => {
      let key = ele.label || ele.key
      return <i-option value={ele.value} key={key}>{key}</i-option>
    })
  }

  renderComp () {
    let { data, config, rangeSeparator, event } = this.getActualOption()

    if (config.type === dynamicCompType.多选框) {
      return <Checkbox v-model={data[config.name]}
        disabled={!this.actuallyEditable}
        on={event} />
    }

    if (this.readonlyType === 'text' && !this.actuallyEditable) {
      return this.renderText()
    }

    if (config.type === dynamicCompType.选择器) {
      let isFn = typeof config.actOptions === 'function'
      let method: any = !isFn ? null : (query) => {
        this.setSelectOption({
          query
        })
      }
      return (
        <Select
          clearable transfer filterable
          v-model={data[config.name]} placeholder={config.remark}
          loading={this.loading} disabled={!this.actuallyEditable}
          on={event} on-on-query-change={method}
        >
          {this.renderOption(this.selectOptions)}
        </Select>
      )
    }

    if (this.isDate) {
      let type = {
        [dynamicCompType.日期]: 'date',
        [dynamicCompType.日期时间]: 'datetime'
      }[config.type] as any
      if (config.isRange) type += 'range'
      return <DatePicker
        clearable transfer
        type={type} v-model={data[config.name]}
        disabled={!this.actuallyEditable}
        on={event}
        placeholder={config.remark} />
    }

    if (config.type === dynamicCompType.时间) {
      let type = 'time' as any
      if (config.isRange) type += 'range'
      return (
        <TimePicker
          transfer
          disabled={!this.actuallyEditable}
          on={event}
          v-model={data[config.name]}
          type={type}
          range-separator={rangeSeparator}
          placeholder={config.remark}
        />
      )
    }

    if (config.type === dynamicCompType.数字输入框) {
      return (
        <InputNumber
          v-model={data[config.name]}
          disabled={!this.actuallyEditable}
          on={event}
          controls-position='right'
          placeholder={config.remark}
        >
        </InputNumber>
      )
    }

    return <Input
      v-model={data[config.name]}
      disabled={!this.actuallyEditable}
      on={event}
      placeholder={config.remark}
      clearable
    >
      {this.queryMatchMode?.show && <span slot='prepend'>
        {this.renderStrPrepend()}
      </span>}
      {config.append && <span slot='append'>{config.append}</span>}
    </Input>
  }

  private renderStrPrepend () {
    return (
      <Select v-model={this.queryMatchMode.value} style='width: 80px'>
        {this.renderOption(dynamicCompStringQueryType.toArray())}
      </Select>
    )
  }

  private renderNumPrepend () {
    return (
      <Select style='width: 80px'>
        {this.renderOption(dynamicCompNumQueryType.toArray())}
      </Select>
    )
  }

  async setSelectOption (opt: { query?}) {
    let { query } = opt
    let { config, data } = this.getActualOption()
    this.loading = true
    let value
    try {
      value = await (config.actOptions as any)(query)
    } finally {
      this.remoteSelectOptions = value || []
      this.loading = false
    }
  }
}

export const DynamicComp = convClass<DynamicCompProp>(DynamicCompModel)
