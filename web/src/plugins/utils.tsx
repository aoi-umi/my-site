import Vue from 'vue'
import 'jquery'
import moment, { Dayjs } from 'dayjs'

import { MyConfirmModal, MyConfirmModalProp } from '@/components/my-confirm'
import { CompModuleType } from '@/views/comp-mgt/comp-mgt-detail'

import { dev, myEnum } from '@/config'
import { assist } from './def'

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
    let inst = this.getComp<MyConfirmModal>(MyConfirmModal, {
      props: {
        ...opt,
        title: opt.title || '提示'
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

  dynamicCompMergeModule (mod: Partial<CompModuleType>[], mod2: DeepPartial<CompModuleType>[]) {
    return mod.map(m => {
      let { itemList, buttonList } = m
      let matchModule = mod2.find(ele2 => ele2.name === m.name)
      let obj = {
        ...m,
        ...matchModule
      }
      if (matchModule) {
        obj.itemList = itemList.map(ele => {
          let match = matchModule.itemList?.find(ele2 => ele2.name === ele.name)
          return {
            ...ele,
            ...match
          }
        })
        obj.buttonList = buttonList.map(ele => {
          let match = matchModule.buttonList?.find(ele2 => ele2.name === ele.name)
          return {
            ...ele,
            ...match
          }
        })
      }
      return obj as CompModuleType
    })
  }
}
declare module 'vue/types/vue' {
  interface Vue {
    $utils: Utils;
    $moment: typeof moment
    $enum: typeof myEnum
  }
}
export default {
  install: function (Vue, options) {
    Vue.prototype.$utils = new Utils()
    Vue.prototype.$moment = moment
    Vue.prototype.$enum = myEnum
  }
}
