import {
    Model, ModelType, DocType, InstanceType,
    setSchema, setStatic,
} from 'mongoose-ts-ua';
import { Schema } from 'mongoose';

import { parseBool } from '@/_system/common';

type PaginationModelType = ModelType<{}, IPagination<{}>>;

type FindAndCountAllOpt = {
    conditions?: any,
    projection?: any,
    sort?: any,
    orderBy?: string;
    sortOrder?: any;
    page?: number,
    rows?: number,
    getAll?: boolean | string,
};
type AggregatePaginateOpt<U> = {
    extraPipeline?: any[];

    //只按其中一个排序
    sort?: Object;
    orderBy?: string;
    sortOrder?: any;

    group?: U;

    page?: number;
    rows?: number;
    noTotal?: boolean;
    getAll?: boolean;
};
type GetSortConditionOpt = {
    sort?: any,
    orderBy?: string;
    sortOrder?: any;
};
export interface IPagination<T> {
    findAndCountAll(opt: FindAndCountAllOpt): Promise<{ total: number; rows: InstanceType<T>[] }>;
    aggregatePaginate<S = {}, U = { total: any }>(pipeline: any[], opt?: AggregatePaginateOpt<U>): Promise<{
        rows: (DocType<InstanceType<T>> & S)[],
        total: number,
        groupRs: { [key in keyof U]: number } & { _id: any, total: number }
    }>;
    getSortCondition(opt: GetSortConditionOpt): any;
};
const Pagination: IPagination<{}> = {
    async findAndCountAll(opt) {
        let self = this as PaginationModelType;
        let query = self.find(opt.conditions, opt.projection);
        let getAll = parseBool(opt.getAll);

        if (!opt.page && !opt.rows) {
            getAll = true;
        }
        if (!getAll) {
            if (opt.page)
                opt.page = parseInt(opt.page as any);
            if (opt.rows)
                opt.rows = parseInt(opt.rows as any);
            if (opt.rows && opt.page)
                query.skip((opt.page - 1) * opt.rows);
            if (opt.rows)
                query.limit(opt.rows);
        }
        let sort = self.getSortCondition(opt);
        query.sort(sort);
        let rs = await Promise.all([
            query.exec(),
            getAll ? null : self.find(opt.conditions).countDocuments().exec(),
        ]);
        let rows = rs[0];
        let total = getAll ? rows.length : rs[1];
        return {
            rows,
            total,
        };
    },

    /**
 	* 分页
 	* @param model
 	* @param pipeline 列表计数共用，过滤条件
 	* @param opt.extraPipeline 仅列表，排序等
     */
    async aggregatePaginate<U>(pipeline, opt?) {
        let model = this as PaginationModelType;
        opt = {
            ...opt
        };
        let { noTotal } = opt;
        let extraPipeline = opt.extraPipeline || [];
        //排序
        let sortCondition = this.getSortCondition(opt);
        extraPipeline = [
            ...extraPipeline,
            { $sort: sortCondition }
        ];
        let { getAll } = opt;
        getAll = parseBool(getAll);
        //分页
        if (!opt.page && !opt.rows) {
            getAll = true;
        }
        if (!getAll) {
            if (opt.page)
                opt.page = parseInt(opt.page as any);
            if (opt.rows)
                opt.rows = parseInt(opt.rows as any);
            if (opt.page && opt.rows)
                extraPipeline.push({ $skip: (opt.page - 1) * opt.rows });
            if (opt.rows)
                extraPipeline.push({ $limit: opt.rows });
        }
        let group = {
            _id: null,
            total: { $sum: 1 },
        };
        if (opt.group) {
            group = { ...group, ...opt.group };
        }
        let [rows, totalRs] = await Promise.all([
            model.aggregate([...pipeline, ...extraPipeline]).exec(),
            !opt.group && (noTotal || getAll) ?
                [] :
                model.aggregate([...pipeline, {
                    $group: group
                }]).exec()
        ]);
        let groupRs = totalRs[0] || {};
        return {
            rows,
            total: getAll ? rows.length : (groupRs.total || 0),
            groupRs: groupRs,
        };
    },

    getSortCondition(options) {
        let sort: any = {};
        if (options.sort) {
            for (let key in options.sort) {
                sort[key] = parseInt(options.sort[key] || -1);
            }
        } else if (options.orderBy) {
            sort[options.orderBy] = parseInt(options.sortOrder || -1);
        }
        if (!sort._id)
            sort._id = -1;
        return sort;
    }
};
export function pagination(schema: Schema) {
    schema.static('findAndCountAll', Pagination.findAndCountAll);
    schema.static('aggregatePaginate', Pagination.aggregatePaginate);
    schema.static('getSortCondition', Pagination.getSortCondition);
};