import Vue from 'vue'
import 'jquery'
import moment, { Dayjs } from 'dayjs'
import * as assist from 'iview/src/utils/assist'

import { MyConfirmModalView, MyConfirmModal, MyConfirmModalProp } from '@/components/my-confirm'

import { dev } from '@/config'

const vm = Vue.prototype as Vue
class Utils {
  getComp<T> (name: any, compOpt?): T {
    let comp = typeof name === 'string' ? Vue.component(name) : name
    if (!comp) {
      let msg = `不存在组件[${name}]`
      vm.$Message.error(msg)
      throw new Error(msg)
    }
    compOpt = {
      ...compOpt
    }
    let inst: any = new Vue({
      render (h) {
        return (<comp ref='comp' props={compOpt.props}>{compOpt.render && compOpt.render(h)}</comp>)
      }
    })
    // let inst: any = new comp({
    //   propsData: compOpt.props
    // })
    inst.$mount()
    document.body.appendChild(inst.$el)
    return inst.$refs.comp
  }
  async confirm (message, opt?: MyConfirmModalProp) {
    opt = {
      ...opt
    }
    let inst = this.getComp<MyConfirmModal>(MyConfirmModalView, {
      props: {
        title: opt.title || '提示',
        confirm: opt.confirm
      },
      render () {
        return <div>{typeof message === 'function' ? message() : message}</div>
      }
    })
    inst.toggle(true)
  }

  async wait (ms: number = 0) {
    let promise = new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, ms)
    })
    return promise
  }

  private scripts: { [key: string]: { url: string, promise: Promise<any> } } = {};
  async loadScript (list: string[]) {
    return Promise.all(list.map(ele => {
      let resolve, reject
      let promise = new Promise((reso, rej) => {
        resolve = reso
        reject = rej
      })
      let script = this.scripts[ele]
      if (script) {
        script.promise.then(() => {
          resolve()
        })
      } else {
        this.scripts[ele] = { url: ele, promise }
        $.getScript(ele, (response, status) => {
          resolve()
        })
      }
      return promise
    }))
  }

  isPressEnter (e: KeyboardEvent) {
    return e && (e.charCode || e.keyCode) === 13
  }

  obj2arr (o: Object) {
    return Object.entries(o).map(ele => {
      return {
        key: ele[0],
        value: ele[1]
      }
    })
  }

  findComponentUpward (context, componentName, componentNames?) {
    return assist.findComponentUpward(context, componentName, componentNames)
  }

  findComponentDownward (context, componentName) {
    return assist.findComponentDownward(context, componentName)
  }

  dateFormat (date, fmt = dev.dateFormat) {
    let format = {
      date: 'YYYY-MM-DD',
      datetime: 'YYYY-MM-DD HH:mm:ss'
    }[fmt] || fmt
    return !date ? '' : moment(date).format(format)
  }
}
declare module 'vue/types/vue' {
  interface Vue {
    $utils: Utils;
    $moment: typeof moment
  }
}
export default {
  install: function (Vue, options) {
    Vue.prototype.$utils = new Utils()
    Vue.prototype.$moment = moment
  }
}
