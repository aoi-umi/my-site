import Vue from 'vue'
import copy from 'copy-to-clipboard'
import AsyncValidator, { ValidateOption } from 'async-validator'

export function convClass<prop, partial extends boolean = false> (t) {
  type P = (partial extends false ? prop : Partial<prop>);
  return t as {
    new(props: P & VueComponentOptions<Partial<prop>>): any
    props: { [key in keyof prop]: { default: any } }
  }
}

export type convType<prop, partial extends boolean = false> = {
  new(props: (partial extends false ? prop : Partial<prop>) & VueComponentOptions<Partial<prop>>): any
}

export function getCompOpts (target) {
  const Ctor = typeof target === 'function'
    ? target
    : target.constructor
  const decorators = Ctor.__decorators__
  const options: any = {}
  if (decorators) {
    decorators.forEach(function (fn) { return fn(options) })
  }
  return options
}

export function getInstCompName (inst) {
  if (inst.componentOptions) { return inst.componentOptions.Ctor.options.name }
}

const vm = Vue.prototype
export class Utils {
  static base64ToFile = (dataUrl: string, filename: string) => {
    const arr = dataUrl.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new File([u8arr], filename, { type: mime })
  }

  static getStyleName (stylePrefix: string, ...args: string[]) {
    return args.filter(ele => !!ele).map(ele => stylePrefix + ele)
  }

  static dateParse (date) {
    if (typeof date == 'string') { date = date.replace(/-/g, '/') }
    if (!isNaN(date) && !isNaN(parseInt(date))) { date = parseInt(date) }
    if (!(date instanceof Date)) { date = new Date(date) }
    return date
  }

  static getDateDiff (date1, date2) {
    date1 = this.dateParse(date1)
    date2 = this.dateParse(date2)

    let isMinus = false
    // date1 开始日期 ，date2 结束日期
    let timestamp = date2.getTime() - date1.getTime() // 时间差的毫秒数
    if (timestamp < 0) {
      timestamp = -timestamp
      isMinus = true
    }
    timestamp /= 1000
    const seconds = Math.floor(timestamp % 60)
    timestamp /= 60
    const minutes = Math.floor(timestamp % 60)
    timestamp /= 60
    const hours = Math.floor(timestamp % 24)
    timestamp /= 24
    const days = Math.floor(timestamp)
    let diff = (days ? days + ' ' : '') + ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2)
    if (isMinus) { diff = '-' + diff }
    return diff
  }

  static copy2Clipboard (txt) {
    copy(txt)
  }

  static isScrollEnd (elm?: HTMLElement | Window) {
    let scrollTop, clientHeight, scrollHeight
    if (!elm || elm instanceof Window || [document.body].includes(elm)) {
      scrollTop = document.documentElement.scrollTop || document.body.scrollTop
      clientHeight = document.documentElement.clientHeight || document.body.clientHeight
      scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight
    } else {
      scrollTop = elm.scrollTop
      clientHeight = elm.clientHeight
      scrollHeight = elm.scrollHeight
    }
    // console.log('--------------');
    // console.log([document.documentElement.scrollTop, document.documentElement.clientHeight, document.documentElement.scrollHeight].join(','));
    // console.log([document.body.scrollTop, document.body.clientHeight, document.body.scrollHeight].join(','));
    // console.log([scrollTop, clientHeight, scrollHeight].join(','));
    return (scrollTop + clientHeight >= scrollHeight)
  }

  static isWxClient () {
    return /MicroMessenger/i.test(navigator.userAgent)
  }

  // 转换为中划线
  static stringToHyphen (str) {
    str = str.replace(/^[A-Z]+/, function () {
      return arguments[0].toLowerCase()
    })
    str = str.replace(/_/g, '-')
    str = str.replace(/[A-Z]/g, function () {
      return '-' + arguments[0].toLowerCase()
    })
    str = str.toLowerCase()
    return str
  }

  static getObjByDynCfg (cfgs) {
    let obj: any = {}
    cfgs?.forEach(ele => {
      obj[ele.name] = null
    })
    return obj
  }

  static getValidRulesByDynCfg (cfgs) {
    let obj = {}
    cfgs?.forEach(ele => {
      if (ele.required) {
        obj[ele.name] = {
          required: true,
          message: `请填写[${ele.text}]`
        }
      }
    })
    return obj
  }

  static valid (data, rules, opt?: ValidateOption & { showMsg?: boolean }) {
    opt = {
      firstFields: true,
      first: true,
      showMsg: true,
      ...opt
    }
    let { showMsg, ...validOpt } = opt
    const validator = new AsyncValidator(rules)
    const result = {
      success: false,
      msg: '',
      invalidFields: null
    }
    return new Promise<typeof result>((resolve) => {
      validator.validate(data, validOpt, (errors, invalidFields) => {
        result.success = !errors
        result.msg = errors ? errors[0].message : ''
        result.invalidFields = invalidFields
      })
      if (showMsg && !result.success) {
        vm.$Message.warning(result.msg)
      }
      resolve(result)
    })
  }

  static wait (ms?) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, ms || 0)
    })
  }
}
