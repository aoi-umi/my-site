
import * as path from 'path';
import { MongoOpt } from '@/_system/dbMongo';

let processEnv = process.env as {
    NODE_ENV: string;
    Port?: string;
    RedisUri?: string;
    MongoUri?: string;
    Host?: string;
    MQUri?: string;
    //pm2
    pm_out_log_path?: string;
};
const urlPrefix = '/devMgt';
const envDir = path.resolve(__dirname, '../../env');
let host = processEnv.Host || 'http://localhost';
let hostWithPrefix = host + urlPrefix;
let name = 'devMgt';
let isDev = !processEnv.NODE_ENV || processEnv.NODE_ENV === 'development';
// console.log(processEnv);
let logPath = processEnv.pm_out_log_path || path.resolve(__dirname, '../../logs/out.log');
export default {
    name,
    port: processEnv.Port || 8000,
    version: '0.0.1',
    cachePrefix: name,
    host: 'http://144.202.99.178',
    redis: {
        uri: processEnv.RedisUri || 'redis://localhost',
    },
    mongoose: {
        uri: processEnv.MongoUri || 'mongodb://localhost',
        options: {
            useNewUrlParser: true,
            // autoReconnect: true,
            useFindAndModify: false,
            dbName: 'devMgt',
            useCreateIndex: true,
            useUnifiedTopology: true
        }
    } as MongoOpt,
    mq: {
        exchange: name,
        mqUri: processEnv.MQUri || 'amqp://localhost'
    },
    api: {},
    urlPrefix,
    logger: {
        name,
        appenders: isDev ?
            { type: 'stdout' } :
            { type: 'dateFile', filename: logPath + `.${processEnv.NODE_ENV}`, daysToKeep: 90 }
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
        // appId: 'wxa72874334956e5c9',
        // appSecret: '1cd084d2b490f012ac01abcae879f748',
        appId: 'wx4f6293a9fba42e66',
        appSecret: 'c76edd3e2a23d34c6003451ea69c46cd',
    }
};