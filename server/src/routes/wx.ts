import { MyRequestHandler } from '@/middleware';
import { wxInst } from '@/3rd-party';
import { paramsValid } from '@/helpers';
import * as ValidSchema from '@/valid-schema/class-valid';
import { mySocket } from '@/main';

export const getCode: MyRequestHandler = async (opt) => {
    let data = opt.reqData;
    let rs = wxInst.getCodeUrl(data.type);
    return rs;
};

export const getUserInfo: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.WxGetUserInfo);
    let rs = await wxInst.getUserInfo(data);
    delete rs.openid;
    return rs;
};

export const codeSend: MyRequestHandler = async (opt) => {
    let data = paramsValid(opt.reqData, ValidSchema.WxCodeSend);
    let rs = mySocket.authRecv(data.token, { code: data.code });
    return rs;
};