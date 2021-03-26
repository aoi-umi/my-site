import { Sequelize, Options, QueryTypes } from 'sequelize';
import { myEnum } from '@/config';


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
  options?: (QuerySqlOptions & { name: string })[]
}

const QuerySqlConfigInnerType = {
  列表计数: 'calc'
};

type QuerySqlConfig = {
  sql: string
  name: string
  parentName?: string
  type?: string
  orderBy?: string
  options?: QuerySqlOptions
}

type QuerySqlOptions = {
  pageIndex?: number
  pageSize?: number
  where?: any
  queryArgs?: any
}

export class MySequelize extends Sequelize {
  constructor(opt: SequelizeOpt) {
    super(opt.uri, opt.options);
  }

  private getParamsWithSql(sql, params) {
    let newParams = {
      ...params
    };
    let reg = /:+(?!\d)(\w+)/g;

    let rs;
    do {
      rs = reg.exec(sql);
      if (rs) {
        let key = rs[1];
        if (newParams[key] === undefined)
          newParams[key] = '';
      }
    } while (rs);
    return newParams;
  }

  async rawQuery(sql: string | string[], params?: any) {
    let sqlStr = typeof sql === 'string' ? sql : sql.join(';\r\n');
    sqlStr = sqlStr.trim();
    if (!sqlStr.endsWith(';')) sqlStr += ';';
    let result: any[];
    try {
      let newParams = this.getParamsWithSql(sqlStr, params);
      let rs = await this.query(sqlStr, { type: QueryTypes.RAW, replacements: newParams });
      result = rs[0].filter(ele => ele instanceof Array);
    } catch (e) {
      console.error(e.message);
      console.log(sqlStr);
      throw new Error(e.message);
    }
    return result;
  }

  private getSql(ele: QuerySqlConfig) {
    let options = { ...ele.options };
    let sql = ele.sql;
    let countSql = '';
    if (ele.type === myEnum.dynamicSqlType.列表) {
      if (!ele.orderBy
        || !options.pageIndex
        || !options.pageSize) throw new Error('列表类型需要排序和分页');
      let from = (options.pageIndex - 1) * options.pageSize;
      let size = options.pageSize;
      let querySql = ele.sql;
      sql = `select * from (${querySql}) t limit ${from}, ${size}`;
      countSql = `select count(1) as count from (${querySql}) t`;
    }
    return {
      sql,
      countSql
    };
  }

  async queryByConfig(cfg: QueryConfig) {
    let params = this.getParams(cfg);

    if (!cfg.config.length)
      throw new Error('config不能为空');
    let { isCfg, sqlList, config, } = this.getSqlList(cfg);
    let rs = await this.rawQuery(sqlList, params);
    if (!isCfg)
      return rs;
    let obj = this.getObjByConfig(config, rs);
    return obj;
  }

  private getSqlList(cfg: QueryConfig) {
    if (!cfg.config.length)
      throw new Error('config不能为空');
    let first = cfg.config[0];

    let isCfg = !(typeof first === 'string');
    let sqlList = [], sqlList2 = [];
    let config = cfg.config as QuerySqlConfig[];
    let config2: QuerySqlConfig[] = [];
    if (!isCfg) {
      sqlList = [
        ...cfg.config,
      ];
    } else {
      if (cfg.options?.length) {
        config.forEach(ele => {
          let match = cfg.options.find(o => o.name === ele.name);
          ele.options = match;
        });
      }
      sqlList = [
        ...config.map((ele) => {
          let rs = this.getSql(ele);
          if (ele.type === myEnum.dynamicSqlType.列表) {
            config2.push({
              ...this.getConfigByType(ele.name, QuerySqlConfigInnerType.列表计数),
              sql: rs.countSql,
            });
            sqlList2.push(rs.countSql);
          }
          return rs.sql;
        }),
      ];
      config = [...config, ...config2];
      sqlList = [...sqlList, ...sqlList2];
    }
    return {
      isCfg,
      sqlList,
      config,
    };
  }

  private getConfigByType(name: string, type) {
    return {
      name: `${name}_${type}`,
      parentName: name,
      type
    };
  }

  getObjByConfig(config: QuerySqlConfig[], result: any[]) {
    let obj = {};
    let idx = 0;
    for (let ele of config) {
      if (ele.type === myEnum.dynamicSqlType.无数据) continue;
      if (!ele.name) {
        idx++;
        continue;
      }
      let val = result[idx];
      switch (ele.type) {
      case myEnum.dynamicSqlType.列表:
        val = {
          rows: val
        };
        break;
      case QuerySqlConfigInnerType.列表计数:
        val = {
          count: val[0].count,
          calc: val[0],
        };
        break;
      }
      if (ele.parentName)
        obj[ele.parentName] = {
          ...val,
          ...obj[ele.parentName],
        };
      else
        obj[ele.name] = val;
      idx++;
    }
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