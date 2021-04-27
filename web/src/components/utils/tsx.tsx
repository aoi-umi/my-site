import Vue from 'vue'
const vm = Vue.prototype as Vue

export const UtilsTsx = {
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
}
