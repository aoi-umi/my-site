import * as config from '@/dev-config';
import { MyRequestHandler } from '@/middleware';
import * as common from '@/_system/common';

export const info: MyRequestHandler = async (opt) => {
  let { user } = opt.myData;
  let exp = Math.ceil(Date.now() / 1000) + 86400 * 7;
  let key = common.md5(
    `${config.env.live.path}/${user._id}-${exp}-${config.env.live.key}`,
  );
  return {
    rtmp: `rtmp://${config.env.live.host}${config.env.live.path}`,
    key: `${user._id}?sign=${exp}-${key}`,
    pullUrl: `http://${config.env.live.host}:${config.env.live.httpPort}${config.env.live.path}/${user._id}.flv`,
  };
};
