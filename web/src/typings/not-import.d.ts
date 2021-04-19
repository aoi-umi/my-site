interface VueComponentOptions<Props = any> {
  key?: any;
  ref?: any;
  class?: any;
  style?: { [key: string]: any } | string;
  props?: Props;
  slot?: string;
  name?: string;
  on?: any;
}

interface UserInfo {
  _id: string;
  account: string;
  nickname: string;
  key: string;
  avatarUrl: string;
  authority: { [key: string]: boolean };
}
