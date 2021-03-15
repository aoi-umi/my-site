import * as pd from 'vue-property-decorator'
import Vue, { PropOptions } from 'vue'
import { Constructor } from 'vue/types/options'
/**
 * decorator of a prop
 * @param  options the options for the prop
 * @return PropertyDecorator | void
 */
declare function MyProp(options?: PropOptions | Constructor[] | Constructor): (target: Object, key: string) => void;
export const Prop = pd.Prop as typeof MyProp
