import { IsDefined } from 'class-validator';

export class WxGetUserInfo {
    @IsDefined()
    code: string;
}

export class WxCodeSend {
    @IsDefined()
    token: string;

    @IsDefined()
    code: string;
}