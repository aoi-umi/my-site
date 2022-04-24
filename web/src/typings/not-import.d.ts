interface VueComponentOptions<Props = any> {
  key?: any
  ref?: any
  class?: any
  style?: { [key: string]: any } | string
  props?: Props
  slot?: string
  name?: string
  on?: any
}

type DeepPartial<T> = T extends Function
  ? T
  : T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T

interface UserInfo {
  _id: string
  account: string
  nickname: string
  key: string
  avatarUrl: string
  authority: { [key: string]: boolean }
}
