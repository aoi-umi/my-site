interface VueComponentOptions<Props = any> {
  key?: string;
  ref?: any;
  class?: any;
  style?: { [key: string]: any } | string;
  props?: Props;
  slot?: string;
  name?: string;
}

interface UserInfo {
  _id: string;
  account: string;
  nickname: string;
  key: string;
  avatarUrl: string;
  authority: { [key: string]: boolean };
}
