import { MyRequestHandler } from '@/middleware';
import { StatUserMapper } from '@/models/mongo/statistics';
import { myEnum } from '@/config';

export let pvSave: MyRequestHandler = async (opt) => {
    let data = opt.reqData;
    await StatUserMapper.create([{
        type: myEnum.statUserType.pv,
        val: data.path
    }]);
};

export let query: MyRequestHandler = async (opt) => {
    let rs = await StatUserMapper.query();
    return rs;
};