
import { transaction } from '@/_system/dbMongo';
import { error } from '@/_system/common';
import * as config from '@/config';
import { myEnum } from '@/config';
import { paramsValid } from '@/helpers';
import * as ValidSchema from '@/valid-schema/class-valid';
import { MyRequestHandler } from '@/middleware';

import { FavouriteMapper } from '@/models/mongo/favourite';

export let submit: MyRequestHandler = async (opt) => {
    let user = opt.myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.FavouriteSubmit);
    let owner = await FavouriteMapper.findOwner({ ownerId: data.ownerId, type: data.type });
    let detail = await FavouriteMapper.create({ ownerId: data.ownerId, userId: user._id, type: data.type });
    //没变化，返回最新的数据
    if (data.favourite == detail.favourite) {
        return {
            favourite: owner.favourite,
        };
    }

    let updateOwner: any = {};
    updateOwner.favourite = owner.favourite + (data.favourite ? 1 : -1);
    detail.favourite = data.favourite;
    if (data.favourite)
        detail.favourAt = new Date();
    await transaction(async (session) => {
        await owner.update(updateOwner, { session });
        await detail.save({ session });
    });
    return updateOwner;
};

export let query: MyRequestHandler = async (opt) => {
    let myData = opt.myData;
    let user = myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.FavouriteQuery);
    let { rows, total } = await FavouriteMapper.query(data, { user, imgHost: myData.imgHost });
    return {
        rows,
        total,
    };
};