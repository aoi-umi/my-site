import { paramsValid } from '@/helpers';
import * as ValidSchema from '@/valid-schema/class-valid';
import { MyRequestHandler } from '@/middleware';

import { ViewHistoryMapper } from '@/models/mongo/view-history';

export let query: MyRequestHandler = async (opt) => {
    let myData = opt.myData;
    let user = myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.ViewHistoryQuery);

    let { rows, total } = await ViewHistoryMapper.query(data, {
        user: user, imgHost: myData.imgHost
    });
    return {
        rows,
        total
    };
};