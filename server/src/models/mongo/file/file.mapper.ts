import { Types } from 'mongoose';

import * as common from '@/_system/common';
import * as config from '@/config';
import { myEnum } from '@/config';
import * as ValidSchema from '@/valid-schema/class-valid';
import { LoginUser } from '@/models/login-user';

import { FileModel } from './file';
import { BaseMapper } from '../_base';

const Prefix = {
    [myEnum.fileType.图片]: config.env.imgPrefix,
    [myEnum.fileType.视频]: config.env.videoPrefix,
};
export class FileMapper {
    static getUrl(_id, fileType: string, opt?: {
        host?: string;
        isRaw?: boolean;
    }) {
        if (!_id)
            return '';
        opt = {
            ...opt
        };
        let host = opt.host;
        if (host) {
            host = '//' + host;
        }
        let url = Prefix[fileType];
        let params: any = {
            _id
        };
        if (opt.isRaw)
            params.isRaw = true;
        return !url ? '' :
            host + url + '?' +
            Object.entries(params)
                .filter(o => o[1])
                .map(o => `${o[0]}=${o[1]}`)
                .join('&');
    }

    static getImgUrl(_id, host?: string) {
        return this.getUrl(_id, myEnum.fileType.图片, { host });
    }

    static getVideoUrl(_id, host?: string) {
        return this.getUrl(_id, myEnum.fileType.视频, { host });
    }

    static async findWithRaw(cond) {
        let fileList = await FileModel.find(cond);
        let rawFileList = fileList.length ? await FileModel.rawFind({ _id: { $in: fileList.map(ele => ele.fileId) } }) : [];
        return fileList.map(file => {
            let rawFile = rawFileList.find(raw => raw._id.equals(file.fileId));
            return {
                file,
                rawFile
            };
        });
    }

    static async upload(opt: {
        fileType: string,
        contentType: string,
        filename: string,
        buffer: Buffer,
        user: Partial<{
            _id: Types.ObjectId;
            nickname: string;
            account: string;
        }>,
        imgHost?: string,
    }) {
        let { user } = opt;

        let fs = new FileModel({
            filename: opt.filename,
            fileType: opt.fileType
        });
        if (user) {
            fs.userId = user._id;
            fs.nickname = user.nickname;
            fs.account = user.account;
        }
        let fileContentType = opt.contentType.split('/')[0];
        if (
            (opt.fileType === myEnum.fileType.视频 && fileContentType !== 'video')
            || opt.fileType === myEnum.fileType.图片 && fileContentType !== 'image'
        )
            throw common.error('错误的文件类型');

        await fs.upload({
            buffer: opt.buffer,
            contentType: opt.contentType,
        });
        let obj = fs.toOutObject();
        obj.url = FileMapper.getUrl(fs._id, opt.fileType, { host: opt.imgHost });
        return obj;
    }

    static async query(data: ValidSchema.ListBase & { fileType?: string }, opt: { user: LoginUser, host?: string }) {
        let { user } = opt;
        let cond: any = {
            userId: user._id,
            isUserDel: { $ne: true }
        };
        if (data.fileType)
            cond.fileType = data.fileType;
        let rs = await FileModel.findAndCountAll({
            ...BaseMapper.getListOptions(data),
            conditions: cond
        });
        let rows = rs.rows.map(ele => {
            let obj = ele._doc as typeof ele._doc & { url?: string };
            obj.url = this.getImgUrl(ele._id, opt.host);
            return obj;
        });
        return {
            ...rs,
            rows
        };
    }
}