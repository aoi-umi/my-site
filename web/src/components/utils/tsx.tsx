import Vue from 'vue'

import { MyConfirmModal, MyConfirmModalProp } from '../my-confirm'
const vm = Vue.prototype as Vue

export const UtilsTsx = {
  getComp<T>(name: any, compOpt?): T {
    let comp = typeof name === 'string' ? Vue.component(name) : name
    if (!comp) {
      let msg = `不存在组件[${name}]`
      vm.$Message.error(msg)
      throw new Error(msg)
    }
    compOpt = {
      ...compOpt,
    }
    let inst: any = new Vue({
      render(h) {
        return (
          <comp ref="comp" props={compOpt.props}>
            {compOpt.render && compOpt.render(h)}
          </comp>
        )
      },
    })
    // let inst: any = new comp({
    //   propsData: compOpt.props
    // })
    inst.$mount()
    document.body.appendChild(inst.$el)
    return inst.$refs.comp
  },
  confirm(message: any | (() => any), opt?: MyConfirmModalProp) {
    opt = {
      ...opt,
    }
    let inst = UtilsTsx.getComp<MyConfirmModal>(MyConfirmModal, {
      props: {
        ...opt,
        title: opt.title || '提示',
      },
      render() {
        return <div>{typeof message === 'function' ? message() : message}</div>
      },
    })
    inst.toggle(true)
  },
}
