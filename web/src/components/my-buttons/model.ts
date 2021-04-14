export class MyButtonsModel {
  name: string
  text: string
  icon?: string
  group?: string
  type?: string
  disabled?: () => boolean
  click?: (btn: MyButtonsModel) => any

  static createGroup (val: MyButtonsModel[]) {
    let obj = {}
    for (let v of val) {
      let group = v.group || v.text
      let o = obj[group]
      if (!o) { o = obj[group] = [] }
      o.push(v)
    }
    return Object.entries(obj).map((ele: any) => {
      return {
        group: ele[0],
        child: ele[1]
      } as MyButtonsGroup
    })
  }
}

export type MyButtonsGroup = { group: string, child: MyButtonsModel[] }
