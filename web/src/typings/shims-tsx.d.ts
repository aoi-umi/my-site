import Vue, { VNode } from 'vue'

declare global {
  namespace JSX {
    // tslint:disable no-empty-interface
    type Element = VNode
    // tslint:disable no-empty-interface
    type ElementClass = Vue
    interface IntrinsicElements {
      [elem: string]: any
    }
  }
}

declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> extends VueComponentOptions {
    [propName: string]: any
  }
}
