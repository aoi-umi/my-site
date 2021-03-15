
import { paramsValid } from '@/helpers';
import { error, escapeRegExp } from '@/_system/common';
import * as config from '@/config';
import * as ValidSchema from '@/valid-schema/class-valid';
import { MyRequestHandler } from '@/middleware/my-request-handler';

import { BookmarkModel, BookmarkInstanceType } from '@/models/mongo/bookmark';
import { BaseMapper } from '@/models/mongo/_base';

export let query: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.BookmarkQuery);
    let query: any = {};
    if (data.anyKey) {
        let anykey = new RegExp(escapeRegExp(data.anyKey), 'i');
        query.$or = [
            { url: anykey },
            { name: anykey },
            { tagList: anykey }
        ];
    }

    if (data.name)
        query.name = new RegExp(escapeRegExp(data.name), 'i');
    if (data.url)
        query.url = new RegExp(escapeRegExp(data.url), 'i');

    let { rows, total } = await BookmarkModel.findAndCountAll({
        conditions: query,
        ...BaseMapper.getListOptions(data),
    });
    return {
        rows,
        total
    };
};

export let save: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.BookmarkSave);
    let detail: BookmarkInstanceType;
    if (!data._id) {
        delete data._id;
        detail = await BookmarkModel.create({
            ...data,
            tagList: data.addTagList
        });
    } else {
        detail = await BookmarkModel.findById(data._id);
        if (!detail)
            throw error('not exists');
        let update: any = {};
        ['name', 'url'].forEach(key => {
            update[key] = data[key];
        });
        if (data.delTagList?.length) {
            detail.tagList = detail.tagList.filter(ele => !data.delTagList.includes(ele));
        }
        if (data.addTagList?.length) {
            detail.tagList = [...detail.tagList, ...data.addTagList];
        }
        update.tagList = detail.tagList;
        await detail.update(update);
    }
    return {
        _id: detail._id
    };
};

export let del: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.BookmarkDel);
    let rs = await BookmarkModel.deleteMany({ _id: { $in: data.idList } });
    if (!rs.n)
        throw error('', config.error.NO_MATCH_DATA);
};