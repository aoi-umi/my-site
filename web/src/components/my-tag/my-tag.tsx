import { Vue, Watch, Component } from 'vue-property-decorator'

import { Prop } from '@/components/property-decorator'

import { convClass, getCompOpts } from '../utils'
import { Tag, Tooltip } from '../iview'
import { TagType } from './model'
export type RenderTagType = string | TagType;

export class MyTagBaseProp<T = RenderTagType> {
    @Prop()
    value?: T | (T[]);

    @Prop()
    singleCheck?: boolean;
}
@Component({
  mixins: [getCompOpts(MyTagBaseProp)]
})
export class MyTagBase<T = RenderTagType> extends Vue<MyTagBaseProp<T>> {
    @Watch('value')
  protected watchValue (newValue) {
    let newList = []
    if (newValue) { newList = newValue instanceof Array ? newValue : [newValue] }
    newList.map(ele => {
      if (typeof ele !== 'string') {
        [{
          key: 'checked',
          value: false
        }, {
          key: 'checkable',
          value: false
        }, {
          key: 'disabled',
          value: false
        }].forEach(e => {
          if (!(e.key in ele)) { this.$set(ele, e.key, e.value) }
        })
      }
    })
    this.tagList = newList
  }

    tagList: T[] = [];

    created () {
      this.watchValue(this.value)
    }

    render () {
      return this.renderTag(this.tagList)
    }

    renderTag (tagList: RenderTagType | (RenderTagType[])) {
      const list = tagList instanceof Array ? tagList : [tagList]
      return (
        <div>
          {list.map(ele => {
            if (typeof ele === 'string') {
              return <Tag color='blue'>{ele}</Tag>
            }
            if (ele.disabled) { return <Tag color='default'>{ele.tag}</Tag> }
            return (
              <Tag color={ele.color as any || 'blue'} checkable={ele.checkable} checked={ele.checked} on-on-change={(checked) => {
                if (!this.singleCheck) {
                  ele.checked = checked
                } else {
                  list.forEach((ele2: TagType) => {
                    ele2.checked = false
                  })
                  ele.checked = checked
                }
                this.$emit('change', checked)
              }}>
                {ele.isDel
                  ? <del>
                    {ele.tag}
                  </del>
                  : ele.tag
                }
              </Tag>
            )
          })}
        </div>
      )
    }
}

const MyTagView = convClass<MyTagBaseProp>(MyTagBase)
export default MyTagView
export interface IMyTag extends MyTagBase { };
