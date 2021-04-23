import { Utils, MyGroupType } from '../utils'

export class MyButtonsModel {
  name: string
  text: string
  icon?: string
  group?: string
  type?: string
  disabled?: boolean
  enable?: () => boolean
  click?: (btn: MyButtonsModel) => any

  static createGroup (val: MyButtonsModel[]) {
    let obj = Utils.group(val, (v) => {
      let group = v.group ? `_group_${v.group}` : v.name
      if (!group) return
      let text = v.group || v.text || ''
      return {
        name: group,
        text
      }
    })

    return obj
  }
}

export type MyButtonsGroup = MyGroupType<MyButtonsModel>
