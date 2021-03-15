
import { paramsValid } from '@/helpers';
import * as ValidSchema from '@/valid-schema/class-valid';
import { MyRequestHandler } from '@/middleware/my-request-handler';
import { FileMapper, FileModel } from '@/models/mongo/file';
import { myEnum } from '@/config';


export let query: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.ListBase);
    let user = opt.myData.user;
    let { rows, total } = await FileMapper.query({
        ...data,
        fileType: myEnum.fileType.图片
    }, { user, host: opt.myData.imgHost });
    return {
        rows,
        total,
    };
};

export let del: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.DelBase);
    let user = opt.myData.user;
    let rs = await FileModel.updateMany({
        _id: { $in: data.idList }, userId: user._id, fileType: myEnum.fileType.图片
    }, {
        isUserDel: true
    });
};