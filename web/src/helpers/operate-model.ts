import Vue from 'vue'
const vm = Vue.prototype as Vue
export type OperateOption = {
  prefix: string
  fn: () => any
  beforeValid?: () => any;
  onSuccessClose?: () => any;
  validate?: () => Promise<boolean>,
  noDefaultHandler?: boolean;
  noSuccessHandler?: boolean;
  noErrorHandler?: boolean;
  defaultErrHandler?: (e: Error & { code?: string }) => boolean | void
}
export class OperateModel {
  loading = false
  protected opt: OperateOption
  constructor (opt: OperateOption) {
    this.opt = opt
  }

  async run () {
    if (this.loading) return

    this.loading = true
    let opt = this.opt
    let operate = opt.prefix || ''
    try {
      opt.beforeValid && await opt.beforeValid()
      if (opt.validate) {
        let valid = await opt.validate()
        if (!valid) {
          vm.$Message.error('参数有误')
          return
        }
      }
      await opt.fn()
      if (!opt.noDefaultHandler && !opt.noSuccessHandler) {
        vm.$Message.success({
          content: operate + '成功',
          onClose: opt.onSuccessClose
        })
      }
    } catch (e) {
      if (!opt.noDefaultHandler && !opt.noErrorHandler) {
        let rs = opt.defaultErrHandler ? opt.defaultErrHandler(e) : true
        if (rs) {
          vm.$Message.error(operate + '出错:' + e.message)
        }
      }
      if (!e.code) { console.error(e) }
    } finally {
      this.loading = false
    }
  }
}
