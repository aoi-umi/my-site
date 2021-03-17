
import { paramsValid } from '@/helpers';
import { error, escapeRegExp } from '@/_system/common';
import * as config from '@/config';
import * as ValidSchema from '@/valid-schema/class-valid';
import { MyRequestHandler } from '@/middleware/my-request-handler';
import * as main from '@/main';

export let exec: MyRequestHandler = async (opt) => {
    let { reqData } = opt;
    let rs = await main.sequelize.myQuery(reqData.sql);
    return rs;
};