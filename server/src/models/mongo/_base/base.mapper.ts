import { escapeRegExp } from '@/_system/common';

export class BaseMapper {
    static getListOptions(data) {
        return {
            page: data.page,
            rows: data.rows,
            sortOrder: data.sortOrder,
            orderBy: data.orderBy
        };
    }

    static multiKeyLike(key: string, likeFn: (likeKey) => any, splitKey = ' ') {
        let and = [];
        let keyList = [];
        if (key) {
            keyList = escapeRegExp(key.trim()).split(splitKey);
        }
        if (keyList.length) {
            and = keyList.map(ele => {
                let anykey = new RegExp(ele, 'i');
                return likeFn(anykey);
            });
        }
        return and;
    }
}