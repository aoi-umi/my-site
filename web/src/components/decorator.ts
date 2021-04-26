import * as pd from 'vue-property-decorator'
import { VueClass } from 'vue-class-component/lib/declarations'
import { PropOptions } from 'vue'
import { Constructor } from 'vue/types/options'
import * as vue from 'vue'

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

/**
 * decorator of a prop
 * @param  options the options for the prop
 * @return PropertyDecorator | void
 */
declare function MyProp(options?: PropOptions | Constructor[] | Constructor): (target: Object, key: string) => void;
export const Prop = pd.Prop as typeof MyProp

declare function MyComponent<V extends vue.default>(options:
  (vue.ComponentOptions<V> | { props?: Function })
  & ThisType<V>): <VC>(target: VC) => VC;
declare function MyComponent<VC extends vue.default>(target: Function): any;
export const Component = (function (options) {
  if (options) {
    let props = options.props
    if (typeof props === 'function') {
      let mixins = options.mixins || []
      mixins.push(getCompOpts(props))
      options = {
        ...options,
        mixins,
        props: null
      }
    }
  }
  return pd.Component(options)
}) as any as typeof MyComponent
export interface VueConstructor {
  new <Props = {}, Mix = {}>(props?: Props & VueComponentOptions<Partial<Props>>): vue.default & Props & Mix
  props?: { [key: string]: { default: any } }
}

export const Vue: VueConstructor = vue.default as any
