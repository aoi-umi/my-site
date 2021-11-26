
import * as path from 'path';

import { ConfigType } from '../src/dev-config/env';

let processEnv = process.env as {
  NODE_ENV: string;
};

export const pathResolve = (...args) => {
  return path.resolve(__dirname, ...args);
};
const urlPrefix = '/devMgt';
const envDir = pathResolve('../env');
let host = 'http://localhost';
let hostWithPrefix = host + urlPrefix;
let name = 'devMgt';
let isDev = !processEnv.NODE_ENV || processEnv.NODE_ENV === 'development';
let logPath = pathResolve('../logs/out.log');
const cfg: ConfigType = {
  isDev,
  name,
  port: 8000,
  version: '0.0.1',
  cachePrefix: name,
  host: 'http://144.202.99.178',
  filePath: pathResolve('../.dev/file'),
  redis: {
    uri: 'redis://localhost',
  },
  mongoose: {
    uri: 'mongodb://localhost',
    options: {
      useNewUrlParser: true,
      // autoReconnect: true,
      useFindAndModify: false,
      dbName: 'devMgt',
      useCreateIndex: true,
      // useUnifiedTopology: true
    }
  },
  sequelize: {
    uri: 'mysql://test:test@localhost/test',
  },
  mq: {
    exchange: name,
    mqUri: 'amqp://localhost'
  },
  api: {},
  urlPrefix,
  logger: {
    name,
    appenders: isDev ?
      { type: 'stdout' } :
      { type: 'dateFile', filename: logPath + `.${processEnv.NODE_ENV || 'dev'}`, daysToKeep: 90 }
  },
  imgPrefix: `${urlPrefix}/img`,
  videoPrefix: `${urlPrefix}/video`,
  ali: {
    sandbox: true,
    appId: '2016100100641227',
    payNotifyUrl: hostWithPrefix + '/alipay/notify',
    refundNotifyUrl: hostWithPrefix + '/alipay/refund/notify',
    rsaPublicPath: path.join(envDir, '/alipay/pub.txt'),
    rsaPrivatePath: path.join(envDir, '/alipay/pri.txt'),
  },
  wx: {
    sandbox: true,
    payNotifyUrl: hostWithPrefix + '/wxpay/notify',
    mch_id: '',
    pay: {
      key: '',
      certPath: path.join(envDir, 'wxpay/apiclient_cert.p12'),
    },
    app: {
      appId: '',
    },
  },
  //公众平台
  wxOffiaCcount: {
    appId: '',
    appSecret: '',
  }
};
export default cfg;
