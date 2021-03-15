
import { paramsValid } from '@/helpers';
import { myEnum } from '@/config';
import * as config from '@/config';
import { Auth } from '@/_system/auth';
import * as ValidSchema from '@/valid-schema/class-valid';
import { MyRequestHandler } from '@/middleware';

import { VideoMapper, VideoModel } from '@/models/mongo/video';
import { ContentMapper } from '@/models/mongo/content';

export let mgtQuery: MyRequestHandler = async (opt) => {
    let myData = opt.myData;
    let user = myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.VideoQuery);

    let { rows, total } = await VideoMapper.query(data, {
        userId: user._id,
        audit: Auth.contains(user, config.auth.videoMgtAudit),
        resetOpt: {
            imgHost: myData.imgHost,
            user,
        }
    });
    return {
        rows,
        total
    };
};

export let mgtDetailQuery: MyRequestHandler = async (opt) => {
    let myData = opt.myData;
    let user = myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.VideoDetailQuery);
    let rs = await VideoMapper.detailQuery({ _id: data._id }, {
        userId: user._id,
        audit: Auth.contains(user, config.auth.videoMgtAudit),
        resetOpt: {
            imgHost: myData.imgHost,
            videoHost: myData.videoHost,
            user,
        }
    });
    return rs;
};

export let mgtSave: MyRequestHandler = async (opt) => {
    let user = opt.myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.VideoSave);
    let detail = await VideoMapper.mgtSave(data, { user });
    return {
        _id: detail._id
    };
};

export let mgtDel: MyRequestHandler = async (opt) => {
    let user = opt.myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.VideoDel);
    await VideoMapper.updateStatus({
        cond: {
            idList: data.idList,
            includeUserId: Auth.contains(user, config.auth.videoMgtDel) ? null : user._id,
            status: { $ne: myEnum.videoStatus.已删除 },
        },
        toStatus: myEnum.videoStatus.已删除, user,
        logRemark: data.remark,
    });
};

export let mgtAudit: MyRequestHandler = async (opt) => {
    let user = opt.myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.VideoMgtAudit);
    let rs = await VideoMapper.updateStatus({
        cond: {
            idList: data.idList,
            status: myEnum.videoStatus.待审核,
        },
        toStatus: data.status, user,
        logRemark: data.remark,
    });
    return rs;
};


export let query: MyRequestHandler = async (opt) => {
    let myData = opt.myData;
    let user = myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.VideoQuery);

    let { rows, total } = await VideoMapper.query(data, {
        normal: true,
        resetOpt: {
            imgHost: myData.imgHost,
            user: user.isLogin ? user : null,
        }
    });
    return {
        rows,
        total
    };
};

export let detailQuery: MyRequestHandler = async (opt) => {
    let myData = opt.myData;
    let user = myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.VideoDetailQuery);
    let rs = await VideoMapper.detailQuery({ _id: data._id }, {
        normal: true,
        resetOpt: {
            imgHost: myData.imgHost,
            videoHost: myData.videoHost,
            user: user.isLogin ? user : null,
        }
    });
    let detail = rs.detail;
    ContentMapper.contentView({ detail, model: VideoModel, user, type: myEnum.contentType.视频 });
    return rs;
};