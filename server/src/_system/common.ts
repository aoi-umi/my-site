/**
 * Created by umi on 2017-5-29.
 */
import * as fs from 'fs';
import * as path from 'path';
import axios, { AxiosRequestConfig } from 'axios';
import * as net from 'net';
import * as crypto from 'crypto';
import * as Q from 'q';
import * as zlib from 'zlib';
import * as config from '@/config';


//#region 前后通用
/**
 *
 * @param fn 带nodeCallback参数的方法
 * @param caller 调用对象
 * @param nodeCallback false通过defer控制,true cb参数控制
 * @param args
 */
export function promise<T>(fn: (...args) => Q.IWhenable<T>, caller?: any, nodeCallback?: boolean, args?: any[]): Q.Promise<T> {
    return Q.fcall((): any => {
        let defer = Q.defer();
        if (!fn) {
            throw error('fn can not be null');
        }
        if (!args)
            args = [];
        if (!nodeCallback) {
            let def = Q.defer();
            args.push(def);
            defer.resolve(fn.apply(caller, args));
        } else {
            args.push(defer.makeNodeResolver());
            fn.apply(caller, args);
        }
        return defer.promise;
    });
};

//示例
// let fun = function (nodeCallback, def) {
//     if (!nodeCallback) {
//         setTimeout(() => {
//             def.resolve('promise_' + nodeCallback);
//         }, 1000);
//         return def.promise;
//     } else if (nodeCallback) {
//         setTimeout(() => {
//             let cb = def;
//             cb(null, 'promise_' + nodeCallback)
//         }, 1000);
//     }
// }
// promise(fun, void 0, false, [false]).then((t) => {
//     console.log(t);
// });

// promise(fun, void 0, true, [true]).then((t) => {
//     console.log(t);
// });

export let promiseAll = function (list: Array<Q.Promise<any>>) {
    let returnData = {
        count: list.length,
        successCount: 0,
        failCount: 0,
        resultList: []
    };
    let d: Q.Deferred<any>;
    promise((defer) => {
        d = defer;
        list.forEach((ele, idx) => {
            ele.then(t => {
                returnData.successCount++;
                returnData.resultList[idx] = { success: true, detail: t };
            }).fail(e => {
                returnData.failCount++;
                returnData.resultList[idx] = { success: false, detail: e };
            }).finally(() => {
                if (returnData.successCount + returnData.failCount == returnData.count)
                    defer.resolve(returnData);
            });
        });
    }).catch(d.reject);
    return d.promise;
};

export let promisify = function (fun, caller?) {
    return function (...args): Q.Promise<any> {
        return promise.apply(void 0, [fun, caller, true, args]);
    };
};

export let promisifyAll = function (obj) {
    for (let key in obj) {
        if (typeof obj[key] == 'function')
            obj[key + 'Promise'] = promisify(obj[key], obj);
    }
};
export let s4 = function (count?: number) {
    let str = '';
    if (count == undefined)
        count = 1;
    if (count > 0) {
        for (let i = 0; i < count; i++) {
            str += (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        }
    }
    return str;
};
export let guid = function () {
    return `${s4(2)}-${s4()}-${s4()}-${s4()}-${s4(3)}`;
};

//字符串
export let stringFormat = function (formatString: string, ...args) {
    if (!formatString)
        formatString = '';
    let reg = /(\{(\d)\})/g;
    if (typeof args[0] === 'object') {
        args = args[0];
        reg = /(\{([^{}]+)\})/g;
    }
    let result = formatString.replace(reg, function () {
        let match = arguments[2];
        return args[match] || '';
    });
    return result;
};
//小写下划线
export let stringToLowerCaseWithUnderscore = function (str) {
    str = str.replace(/^[A-Z]+/, function () {
        return arguments[0].toLowerCase();
    });
    str = str.replace(/_/g, '');
    str = str.replace(/[A-Z]/g, function () {
        return '_' + arguments[0].toLowerCase();
    });
    str = str.toLowerCase();
    return str;
};
//驼峰（小驼峰）
export let stringToCamelCase = function (str) {
    str = str.replace(/_([a-zA-Z])/g, function () {
        return arguments[1].toUpperCase();
    });
    return str[0].toLowerCase() + str.substr(1);
};
//帕斯卡（大驼峰）
export let stringToPascal = function (str) {
    str = str.replace(/_([a-zA-Z])/g, function () {
        return arguments[1].toUpperCase();
    });
    return str[0].toUpperCase() + str.substr(1);
};

export let clone = function <T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
};


/**
 * enumerable装饰器
 */
export function enumerable(value: boolean): PropertyDecorator;
export function enumerable(value: boolean): MethodDecorator;
export function enumerable(value: boolean) {
    return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
        if (descriptor) {
            descriptor.enumerable = value;
            //return descriptor;
        } else {
            descriptor = Object.getOwnPropertyDescriptor(target, propertyKey) || {};
            if (descriptor.enumerable != value) {
                descriptor.enumerable = value;
                Object.defineProperty(target, propertyKey, descriptor);
            }
        }
    };
}

export function getDataInKey(data, keyList: string[]) {
    let newData = {};
    keyList.forEach(key => {
        if (![undefined, null].includes(data[key]))
            newData[key] = data[key];
    });
    return newData;
}

export function distinct<T = any>(list: T[], fn?: (list: T[], val: T) => boolean): T[] {
    let rtn = [];
    for (let val of list) {
        if (fn ? fn(rtn, val) : !rtn.includes(val))
            rtn.push(val);
    }
    return rtn;
}
//#endregion

//#region 同名但实现不同
export let md5 = function (data: string | Buffer, option?: { encoding: string }) {
    let opt = {
        encoding: 'hex',
    };
    opt = extend(opt, option);
    let md5 = crypto.createHash('md5');
    if (typeof (data) == 'string')
        data = Buffer.from(data, 'utf8');

    let code = md5.update(data).digest(opt.encoding as any);
    return code;
};

//code: string || errorConfig
export let error = function (msg, code?, option?: { remark?: string, format?: string; lang?: string }) {
    let opt = {
        lang: 'zh',
        format: null,
        remark: null
    };
    let status = null;
    if (option)
        opt = extend(opt, option);
    if (!code)
        code = '';
    let error;
    if (typeof code !== 'string') {
        error = code;
        code = error.code;
    }
    else {
        error = getErrorConfigByCode(code);
    }
    if (error) {
        status = error.status;
        if (!msg) {
            let filepath = `../config/lang/${opt.lang}`;
            let resolvePath = path.resolve(`${__dirname}/${filepath}.js`);
            let isExist = fs.existsSync(resolvePath);
            let lang = require(isExist ? filepath : '../config/lang/zh');
            msg = lang.errorConfig[code];
            if (typeof opt.format == 'function')
                msg = opt.format(msg);
            if (!msg)
                msg = code;
        }
    }
    if (!msg) msg = '';
    if (typeof msg == 'object') msg = JSON.stringify(msg);
    let err: any = new Error(msg);
    let remark = opt.remark;
    if (remark)
        err.remark = remark instanceof Array ? remark.join('#') : remark;
    err.code = code;
    err.status = status;
    return err;
};
//#endregion

//#region only
export let extend = function (...args) {
    let res = args[0] || {};
    for (let i = 1; i < args.length; i++) {
        let arg = args[i];
        if (typeof (arg) !== 'object') {
            continue;
        }
        for (let key in arg) {
            if (arg[key] !== undefined)
                res[key] = arg[key];
        }
    }
    return res;
};

type RequestServiceOption = AxiosRequestConfig & { raw?: boolean };
export type RequestServiceByConfigOption = {
    serviceName?: string;
    methodName?: string;
    beforeRequest?: Function;
    afterResponse?: Function;
    outLog?: any;
} & RequestServiceOption;
export let requestServiceByConfig = function (option: RequestServiceByConfigOption) {
    let method = '';
    let url = '';
    let log = logModle();
    let startTime = new Date().getTime();
    return promise(async function () {
        let errStr = `service "${option.serviceName}"`;
        type Args = {
            host: string;
        };
        let service = config.env.api[option.serviceName] as {
            defaultArgs: Args,
            method: {
                [methodName: string]: {
                    url: string;
                    method: string;
                    isUseDefault: boolean;
                    args: Args;
                }
            }
        };
        if (!service) throw error(`${errStr} is not exist!`);
        let serviceArgs = clone(service.defaultArgs);

        let defaultMethodArgs = {
            isUseDefault: true,
            method: 'POST',
        };
        let methodConfig = service.method[option.methodName];
        methodConfig = extend(defaultMethodArgs, methodConfig);

        if (!methodConfig.isUseDefault) {
            serviceArgs = extend(serviceArgs, methodConfig.args);
        }

        let host = serviceArgs.host;
        if (!host) throw error(`${errStr} host is empty!`);

        method = methodConfig.method;
        url = methodConfig.url;
        if (!url) throw error(`${errStr} method "${option.methodName}" url is empty!`);
        url = host + url;
        let opt: AxiosRequestConfig = {
            url: url,
            data: option.data,
            method: method as any
        };
        if (option.beforeRequest) {
            //发送的参数 当前所用参数
            await option.beforeRequest(opt, serviceArgs);
        }
        log.guid = guid();
        log.url = url;
        log.req = opt.data;
        log.method = `[${option.serviceName}][${option.methodName}]`;
        let { response, data } = await requestService(opt);
        log.duration = startTime - new Date().getTime();

        log.result = true;
        log.res = data;
        if (option.afterResponse) {
            data = await option.afterResponse(data, response);
        }
        return data;
    }).fail(function (e) {
        log.result = false;
        log.res = e;
        console.log(`request ${log.method} error`);
        console.log(`url: ${url}`);
        throw e;
    }).finally(() => {
        option.outLog = log;
    });
};

export let requestService = function (option: RequestServiceOption) {
    let opt: RequestServiceOption = {
        method: 'POST',
    };
    opt = extend(opt, option);
    if (!opt.headers) opt.headers = {};
    opt.headers['x-requested-with'] = 'xmlhttprequest';
    //console.log(opt)
    return promise(async function () {
        let response = await axios.request(opt);
        let data = response.data;
        let encoding = response.headers['content-encoding'];
        switch (encoding) {
            case 'gzip':
                data = await promisify(zlib.unzip)(data);
                break;
            default:
                if (encoding)
                    throw error(`Not Accept Encoding:${encoding}`);
        }

        if (!opt.raw && Buffer.isBuffer(data)) {
            data = data.toString();
            if (data && typeof data == 'string')
                data = JSON.parse(data);
        }
        return { response, data };
    });
};

export let getErrorConfigByCode = function (code) {
    if (!code)
        return undefined;
    for (let key in config.error) {
        if (config.error[key].code == code)
            return config.error[key];
    }
};

export let IPv4ToIPv6 = function (ip, convert?: boolean) {
    if (!net.isIPv4(ip))
        return ip;
    if (!convert) {
        ip = '::ffff:' + ip;
    } else {
        //转为2进制的数，每4位为一组，转换成16进制的
        //192.168.1.1  11000000 10101000 00000001 00000001  C0 A8 01 01 0:0:0:0:0:0:C0A8:0101  ::C0A8:0101
        let ipv6 = [];
        let list = ip.split('.');
        for (let i = 0; i < list.length; i++) {
            let t = parseInt(list[i]).toString(2);
            let fixNum = 8 - t.length;
            if (fixNum != 0) {
                t = '00000000'.slice(-fixNum) + t;
            }
            ipv6.push(parseInt(t.substr(0, 4), 2).toString(16));
            ipv6.push(parseInt(t.substr(4, 4), 2).toString(16));
        }
        let ipv6List = [];
        let ipv6Str = '';
        for (let i = 0; i < ipv6.length; i++) {
            ipv6Str += ipv6[i];
            if ((i + 1) % 4 == 0 && ipv6Str) {
                ipv6List.push(ipv6Str);
                ipv6Str = '';
            }
        }
        ip = '::' + ipv6List.join(':');
    }
    return ip;
};

export let logModle = function () {
    return {
        url: null,
        application: null,
        method: null,
        methodName: null,
        result: null,
        code: null,
        req: null,
        res: null,
        createDate: new Date(),
        remark: null,
        guid: null,
        ip: null,
        duration: null,
        requestIp: null,
    };
};

// import * as soap from 'soap';
// let url = 'http://www.webxml.com.cn/WebServices/WeatherWebService.asmx?wsdl';
// let args = { byProvinceName: '浙江'};
// soap.createClient(url, function(err, client) {
//     client.getSupportCity(args, function(err, result) {
//         if (err) {
//             console.log(err);
//         }else {
//             console.log(result);
//         }
//     });
// });

export let streamToBuffer = function (stream: fs.ReadStream) {
    return promise(function (defer: Q.Deferred<Buffer>) {
        let buffers = [];
        stream.on('data', function (buffer) {
            buffers.push(buffer);
        });
        stream.on('end', function () {
            let buffer = Buffer.concat(buffers);
            defer.resolve(buffer);
        });
        stream.on('error', defer.reject);
        return defer.promise;
    });
};

export let getListDiff = function <T1, T2>(option: {
    list: T1[],
    newList?: T2[],
    compare?: (t1: T1, t2: T2) => boolean,
    delReturnValue?: (t: T1) => any,
    addReturnValue?: (t: T2) => any,
}) {
    let opt: any = {
        compare: function (item1, item2) {
            return item1 == item2;
        },
        delReturnValue: function (item) {
            return item;
        },
        addReturnValue: function (item) {
            return item;
        }
    };
    opt = extend(opt, option);
    let list = opt.list, newList = opt.newList,
        compare = opt.compare, delReturnValue = opt.delReturnValue, addReturnValue = opt.addReturnValue;
    let delList = [];
    let addList = [];
    if (newList?.length) {
        list.forEach(function (item) {
            let match = newList.find(function (item2) {
                return compare(item, item2);
            });
            if (!match)
                delList.push(delReturnValue(item));
        });
        newList.forEach(function (item2) {
            let match = list.find(function (item) {
                return compare(item, item2);
            });
            if (!match)
                addList.push(addReturnValue(item2));
        });
    } else {
        list.forEach(function (item) {
            delList.push(delReturnValue(item));
        });
    }
    return {
        addList: addList,
        delList: delList
    };
};

export let parseBool = function (b) {
    return b && (b == 1 || b.toLocaleString() == 'true');
};

export let escapeRegExp = function (string: string) {
    return string.replace(/([.*+?^${}()|\[\]\/\\])/g, '\\$1');
};

export let isObjectEmpty = function (obj) {
    let empty = true;
    if (obj) {
        for (let key in obj) {
            empty = false;
            break;
        }
    }
    return empty;
};
//#endregion

//删除require
//delete require.cache[require.resolve('./configData')];

//.prototype
//.prototype.constructor
//[] instanceof Array
//[].constructor == Array