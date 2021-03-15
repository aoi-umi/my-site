export * from './utils'
import * as _convert from './convert'
export const convert = _convert
export * from './OperateModel'

export const mathjs = {
  round (x: number, n?: number) {
    if (n) {
      const r = 10 ** n
      return Math.round(x * r) / r
    }
    return Math.round(x)
  }
}
