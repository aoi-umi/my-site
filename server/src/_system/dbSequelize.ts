import { Sequelize, Options, QueryTypes } from 'sequelize';


export type SequelizeOpt = {
    uri: string;
    options?: Options
}

export type QueryConfig = {
    // {param1: 'int', param2: 'varchar(50)'}
    paramsDefine?: { [key: string]: string }
    params?: any
    // string类型直接返回数组, 否则按配置构造模型
    config: QuerySqlConfig[] | string[]
}

type QuerySqlConfig = {
    sql: string
    name: string
    noData?: boolean
}

export class MySequelize extends Sequelize {
    constructor(opt: SequelizeOpt) {
        super(opt.uri, opt.options);
    }

    async rawQuery(sql: string | string[], params?: any) {
        let sqlStr = typeof sql === 'string' ? sql : sql.join('\r\n');
        let rs = await this.query(sqlStr, { type: QueryTypes.RAW, replacements: params });
        let result = rs[0].filter(ele => ele instanceof Array);
        return result;
    }

    async queryByConfig(cfg: QueryConfig) {
        let sqlList = [];
        let params = this.getParams(cfg);

        if (!cfg.config.length)
            throw new Error('config不能为空');
        let first = cfg.config[0];
        let isCfg = !(typeof first === 'string');
        let config = cfg.config as QuerySqlConfig[];
        if (!isCfg) {
            sqlList = [
                ...sqlList,
                ...cfg.config,
            ];
        } else {
            sqlList = [
                ...sqlList,
                ...config.map((ele) => {
                    return ele.sql;
                }),
            ];
        }

        let rs = await this.rawQuery(sqlList, params);
        if (!isCfg)
            return rs;
        let obj = {};
        let idx = 0;
        config.forEach(ele => {
            if (!ele.noData) {
                if (ele.name)
                    obj[ele.name] = rs[idx];
                idx++;
            }
        });
        return obj;
    }

    private getParams(cfg: QueryConfig) {
        let params = {
            ...cfg.params
        };
        if (cfg.paramsDefine) {
            let def = cfg.paramsDefine;
            if (cfg.paramsDefine instanceof Array) {
                def = {};
                cfg.paramsDefine.forEach(ele => {
                    def[ele] = '';
                });
            }
            for (let key in def) {
                if (params[key] === undefined)
                    params[key] = null;
            }
        }
        return params;
    }
}

export const init = async (opt: SequelizeOpt) => {
    let sequelize = new MySequelize({
        uri: opt.uri,
        options: {
            define: {
                timestamps: false,
            },
            dialectOptions: {
                multipleStatements: true
            },
            ...opt.options,
        }
    });
    return {
        sequelize
    };
};