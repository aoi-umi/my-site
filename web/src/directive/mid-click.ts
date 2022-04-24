import Vue from 'vue'

const midClickObject = {
  downEl: {},
  mousedown: (e) => {
    downEl[e] = true
  },
  mouseup: (e: MouseEvent) => {
    let key = e as any
    if (downEl[key]) {
      if (e.button === 1) {
        let event = new MouseEvent('click', e)
        ;(<HTMLElement>e.target).dispatchEvent(event)
      }
    }
    downEl[key] = false
  },
}
const downEl = midClickObject.downEl
Vue.directive('mid-click', {
  bind: function (el: HTMLElement, binding, vnode) {
    el.addEventListener('mousedown', midClickObject.mousedown)
    el.addEventListener('mouseup', midClickObject.mouseup)
  },
  unbind: (el: HTMLElement) => {
    el.removeEventListener('mousedown', midClickObject.mousedown)
    el.removeEventListener('mouseup', midClickObject.mouseup)
  },
})
