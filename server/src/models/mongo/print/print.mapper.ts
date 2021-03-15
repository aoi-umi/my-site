import { LoginUser } from '@/models/login-user';
import * as ValidSchema from '@/valid-schema/class-valid';
import { escapeRegExp } from '@/_system/common';
import { error } from '@/_system/common';
import { BaseMapper } from '../_base';

import { PrintInstanceType, PrintModel, } from './print';
export class PrintMapper {
    static async query(data: ValidSchema.PrintQuery, opt: {
        user: LoginUser
    }) {
        let query: any = {}, $and = [];

        if (data.name)
            query.name = new RegExp(escapeRegExp(data.name), 'i');
        if (opt.user.isLogin) {
            $and.push({
                $or: [{ userId: null }, { userId: opt.user._id }]
            });
        } else {
            $and.push({
                $or: [{ userId: null }, ]
            });
        }
        if ($and.length)
            query.$and = $and;
        let rs = await PrintModel.findAndCountAll({
            ...BaseMapper.getListOptions(data),
            conditions: query,
            projection: { data: 0 },
        });
        return rs;
    }

    static async detailQuery(data: ValidSchema.PrintDetailQuery, opt: {
        user: LoginUser
    }) {
        let rs = await PrintModel.findById(data._id);
        return rs;
    }

    static async save(data: any, opt: {
        user: LoginUser
    }) {
        let detail: PrintInstanceType;
        if (!data._id) {
            delete data._id;
            if (opt.user.isLogin)
                data.userId = opt.user._id;
            detail = new PrintModel(data);
            await detail.save();
        } else {
            detail = await PrintModel.findOne({ _id: data._id });
            if (detail.userId && !opt.user.equalsId(detail.userId))
                throw new Error('无权限修改');
            let update: any = {};
            ['name', 'data'].forEach(key => {
                console.log(key);
                update[key] = data[key];
            });
            await detail.update(update);
        }
        return detail;
    }

    static getPrintLogic(type) {
        let logic = printLogic[type];
        if (!logic)
            throw error(`错误的打印类型[${type}]`);
        return logic;
    }

    static async execPrintLogic(opt: { type: string, data: any }) {
        let logic = this.getPrintLogic(opt.type);
        return logic(opt.data);
    }

    static setPrintLogic(type, fn: GetPrintDataType) {
        if (printLogic[type])
            throw error(`打印类型[${type}]已存在`);
        printLogic[type] = fn;
    }
}

type ArrayOrSelf<T> = Array<T> | T
type PromiseOrSelf<T> = Promise<T> | T
type PrintDataType = {
    label?: string;
    template: any;
    data: any[];
};
type GetPrintDataType = (data) => PromiseOrSelf<ArrayOrSelf<PrintDataType>>
const printLogic: { [key: string]: GetPrintDataType } = {};