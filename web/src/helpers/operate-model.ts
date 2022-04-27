import Vue from 'vue'
const vm = Vue.prototype as Vue
export type OperateOption<T = any> = {
  prefix?: string
  fn: (args?: T) => any
  beforeValid?: (args?: T) => any
  onSuccessClose?: () => any
  validate?: (args?: T) => Promise<boolean> | boolean | void
  noValidMessage?: boolean
  noDefaultHandler?: boolean
  noSuccessHandler?: boolean
  noErrorHandler?: boolean
  throwError?: boolean
  defaultErrHandler?: (e: Error & { code?: string }) => boolean | void
}
export class OperateModel<T = any> {
  loading = false
  protected opt: OperateOption<T>
  constructor(opt: OperateOption<T>) {
    this.opt = opt
  }

  async run(
    args?: T & {
      options?: Partial<OperateOption>
    },
  ) {
    if (this.loading) return
    const result = {
      success: true,
      msg: '',
      err: null,
      data: null,
    }
    this.loading = true
    let opt = {
      ...this.opt,
      ...args.options,
    }
    let operate = opt.prefix || ''
    try {
      opt.beforeValid && (await opt.beforeValid(args))
      if (opt.validate) {
        let valid = await opt.validate(args)
        if (!valid) {
          result.success = false
          result.msg = '参数有误'
          if (opt.throwError) throw new Error(result.msg)
          if (!this.opt.noValidMessage) {
            vm.$Message.error(result.msg)
          }
          return result
        }
      }
      result.data = await opt.fn(args)
      if (!opt.noDefaultHandler && !opt.noSuccessHandler) {
        vm.$Message.success({
          content: operate + '成功',
          onClose: opt.onSuccessClose,
        })
      }
    } catch (e) {
      if (opt.throwError) throw e
      result.success = false
      result.msg = e.message
      result.err = e
      if (!opt.noDefaultHandler && !opt.noErrorHandler) {
        let rs = opt.defaultErrHandler ? opt.defaultErrHandler(e) : true
        if (rs) {
          vm.$Message.error(operate + '出错:' + e.message)
        }
      }
      if (!e.code) {
        console.error(e)
      }
    } finally {
      this.loading = false
    }
    return result
  }
}
