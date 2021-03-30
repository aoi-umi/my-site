import { Sequelize, Options, QueryTypes } from 'sequelize';
import { myEnum } from '@/config';
import * as common from '@/_system/common';


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
  options?: QueryConfigOption[]
}

type QueryConfigOption = {
  name: string
  query?: QuerySqlOptions
  fields?: QueryFieldsOptions
}

type QueryFieldsOptions = { [key: string]: { name: string, calcType?: string } }

const QuerySqlConfigInnerType = {
  列表计数: 'calc',
  列表分页计数: 'subCalc',
};

type QuerySqlConfig = {
  sql: string
  name: string
  parentName?: string
  type?: string
  orderBy?: string
  options?: QueryConfigOption
}

type QuerySqlOptions = {
  pageIndex?: number
  pageSize?: number
  where?: any
  queryArgs?: any
}

export class MySequelize extends Sequelize {
  options: Options;
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

  private getListSql(ele: QuerySqlConfig) {
    let options = { ...ele.options };
    let sql = ele.sql;
    let calcSql = '';
    let subCalcSql = '';
    if (!ele.orderBy) throw new Error('列表类型需要排序');
    let srcSql = ele.sql;
    let { whereSql, limit } = this.getWhereSql(options.query);
    let { groupSql } = this.getGroupSql(options.fields);

    sql = `select * from (${srcSql}) t ${whereSql} order by ${ele.orderBy} ${limit}`;

    let count = 'count(1) as count';
    if (groupSql)
      count = `${count}, ${groupSql}`;
    if (groupSql || limit) {
      calcSql = `select ${count} from (${srcSql}) t ${whereSql}`;
    }
    if (groupSql && limit) {
      subCalcSql = `select ${groupSql} from (${sql}) t`;
    }
    return {
      sql,
      calcSql,
      subCalcSql
    };
  }

  private getWhereSql(options: QuerySqlOptions) {
    options = {
      ...options,
    };
    let whereSql = [];

    let queryArgs = options.queryArgs as { [key: string]: { value: any, mode: string } };
    if (queryArgs) {
      for (let key in queryArgs) {
        let args = queryArgs[key];
        let val = args.value;
        if (typeof val === 'string')
          val = val.trim();
        if ([undefined, null, ''].includes(val))
          continue;
        let op = '';
        switch (args.mode) {
        case myEnum.dynamicCompStringQueryType.模糊:
          op = 'like';
          val = `%${val}%`;
          break;
        case myEnum.dynamicCompStringQueryType.左模糊:
          op = 'like';
          val = `%${val}`;
          break;
        case myEnum.dynamicCompStringQueryType.右模糊:
          op = 'like';
          val = `${val}%`;
          break;
        default:
          op = '=';
          break;
        }
        whereSql.push(`${key} ${op} ${common.sqlEscape(val, this.options.timezone, this.options.dialect)}`);
      }
    }


    //分页
    let limit = '';
    if (options.pageIndex && options.pageSize) {
      let from = (options.pageIndex - 1) * options.pageSize;
      let size = options.pageSize;
      limit = `limit ${from}, ${size}`;
    }
    return {
      whereSql: whereSql.length ? `where ${whereSql.join(' and ')}` : '',
      limit
    };
  }

  private getGroupSql(options: QueryFieldsOptions) {
    options = {
      ...options
    };
    let groupSql = [];
    for (let key in options) {
      let field = options[key];
      let fieldName = `\`${field.name}\``;
      if (!field.calcType) continue;
      switch (field.calcType) {
      default:
        groupSql.push(`${field.calcType}(${fieldName}) as ${fieldName}`);
        break;
      }
    }

    // 汇总
    return {
      groupSql: groupSql.length ? `${groupSql.join(', ')}` : ''
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
      if (cfg.options) {
        config.forEach(ele => {
          let match = cfg.options.find(o => o.name === ele.name);
          ele.options = match;
        });
      }
      sqlList = [
        ...config.map((ele) => {
          if (ele.type === myEnum.dynamicSqlType.列表) {
            let rs = this.getListSql(ele);
            if (rs.calcSql) {
              config2.push({
                ...this.getConfigByType(ele.name, QuerySqlConfigInnerType.列表计数),
                sql: rs.calcSql,
              });
              sqlList2.push(rs.calcSql);
            }
            if (rs.subCalcSql) {
              config2.push({
                ...this.getConfigByType(ele.name, QuerySqlConfigInnerType.列表分页计数),
                sql: rs.subCalcSql,
              });
              sqlList2.push(rs.subCalcSql);
            }
            return rs.sql;
          }
          return ele.sql;
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

  private configFor(config: QuerySqlConfig[], fn: (ele: QuerySqlConfig, idx: number) => void) {
    let idx = 0;
    for (let ele of config) {
      if (ele.type === myEnum.dynamicSqlType.无数据) continue;
      if (!ele.name) {
        idx++;
        continue;
      }
      fn(ele, idx);
      idx++;
    }

  }

  getObjByConfig(config: QuerySqlConfig[], result: any[]) {
    let obj = {};
    this.configFor(config, (ele, idx) => {
      let val = result[idx];
      switch (ele.type) {
      case myEnum.dynamicSqlType.列表:
        val = {
          count: val.length,
          rows: val
        };
        break;
      case QuerySqlConfigInnerType.列表计数:
        val = {
          count: val[0].count,
          calc: val[0],
        };
        break;
      case QuerySqlConfigInnerType.列表分页计数:
        val = {
          subCalc: val[0],
        };
        break;
      }
      if (ele.parentName)
        obj[ele.parentName] = {
          ...obj[ele.parentName],
          ...val,
        };
      else
        obj[ele.name] = val;
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