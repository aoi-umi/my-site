import * as Redis from 'ioredis';
import * as moment from 'dayjs';

import * as config from '@/config';
import * as common from './common';

function writeCacheErr(err) {
    console.error(moment().format('YYYY-MM-DD HH:mm:ss'), 'Cache Error [' + err + ']');
}

let connectErrorTimes = 0;

type CacheConfig = {
    prefix: string;
    time?: number;
    key?: string;
};

export class Cache {
    client: Redis.Redis;
    cachePrefix: string;
    constructor(uri: string, cachePrefix?: string) {
        let client = this.client = new Redis(uri);
        client.on('error', function (err) {
            if (err.code == 'ECONNREFUSED') {
                if (connectErrorTimes % 10 == 0) {
                    writeCacheErr(err);
                    connectErrorTimes = 0;
                }
                connectErrorTimes++;
            } else {
                writeCacheErr(err);
            }
        });
        this.cachePrefix = cachePrefix;
    }

    private getKey(key: string[]) {
        return key.join(':');
    }

    get(key: string) {
        return common.promise((defer: Q.Deferred<any>) => {
            this.client.get(this.getKey([this.cachePrefix, key])).then(result => {
                if (result && typeof result == 'string') {
                    try {
                        result = JSON.parse(result);
                    }
                    catch (e) {
                    }
                }
                defer.resolve(result);
            }).catch(defer.reject);
            //超时
            setTimeout(function () {
                defer.reject(common.error('Cache Get Timeout', config.error.CACHE_TIMEOUT));
            }, 10 * 1000);
            return defer.promise;
        });
    }

    //expire seconds
    set(key: string, value, expire?) {
        if (typeof value == 'object')
            value = JSON.stringify(value);
        let args = [this.getKey([this.cachePrefix, key]), value];
        if (expire)
            args = [...args, 'EX', expire];
        return (this.client.set as any)(...args);
    }

    del(key: string) {
        return this.client.del(this.getKey([this.cachePrefix, key]));
    }

    keys(pattern: string) {
        return this.client.keys(pattern);
    }

    getByCfg(cfg: CacheConfig) {
        let l = [cfg.prefix];
        if (cfg.key)
            l.push(cfg.key);
        return this.get(this.getKey(l));
    }

    setByCfg(cfg: CacheConfig, value) {
        let l = [cfg.prefix];
        if (cfg.key)
            l.push(cfg.key);
        return this.set(this.getKey(l), value, cfg.time);
    }

    delByCfg(cfg: CacheConfig) {
        let l = [cfg.prefix];
        if (cfg.key)
            l.push(cfg.key);
        return this.del(this.getKey(l));
    }
}