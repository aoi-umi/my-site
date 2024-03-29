import * as config from 'config';
import { MongoOpt } from '@/_system/dbMongo';
import { SequelizeOpt } from '@/_system/dbSequelize';

export type ConfigType = {
  isDev: boolean;
  monitorEnable: boolean;
  name: string;
  port: number;
  version: string;
  cachePrefix: string;
  host: string;
  filePath: string;
  redis: {
    uri: string;
  };
  mongoose: MongoOpt;
  sequelize: SequelizeOpt;
  mq: {
    exchange: string;
    mqUri: string;
  };
  api: {};
  urlPrefix: string;
  logger: {
    name;
    appenders: any;
  };
  imgPrefix: string;
  videoPrefix: string;
  rawFilePrefix: string;
  ali: {
    sandbox: boolean;
    appId: string;
    payNotifyUrl: string;
    refundNotifyUrl: string;
    rsaPublicPath: string;
    rsaPrivatePath: string;
  };
  wx: {
    sandbox: boolean;
    payNotifyUrl: string;
    mch_id: string;
    pay: {
      key: string;
      certPath: string;
    };
    app: {
      appId: string;
    };
  };
  //公众平台
  wxOfficialAccount: {
    appId: string;
    appSecret: string;
  };
  github: {
    clientId: string;
    clientSecret: string;
  };
  live: {
    host: string;
    httpPort: number;
    path: string;
    key: string;
  };
};

export type ConfigTypeOption = DeepPartial<ConfigType>;

export default config as config.IConfig & ConfigType;
