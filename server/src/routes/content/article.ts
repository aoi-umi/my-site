
import { paramsValid } from '@/helpers';
import { myEnum } from '@/config';
import * as config from '@/config';
import { Auth } from '@/_system/auth';
import * as ValidSchema from '@/valid-schema/class-valid';
import { MyRequestHandler } from '@/middleware';

import { ArticleModel, ArticleMapper } from '@/models/mongo/article';
import { ContentMapper } from '@/models/mongo/content';

/**
 * @api {get} /article/mgt/query mgt query
 * @apiGroup article
 * @apiParamClass (src/valid-schema/class-valid/article.ts) {AritcleQuery}
 */
export let mgtQuery: MyRequestHandler = async (opt, ctx) => {
    let user = opt.myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.ArticleQuery);

    let { rows, total } = await ArticleMapper.query(data, {
        userId: user._id,
        audit: Auth.contains(user, config.auth.articleMgtAudit),
        resetOpt: {
            imgHost: opt.myData.imgHost,
            user,
        }
    });
    return {
        rows,
        total
    };
};

export let mgtDetailQuery: MyRequestHandler = async (opt, ctx) => {
    let user = opt.myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.ArticleDetailQuery);
    let rs = await ArticleMapper.detailQuery({ _id: data._id }, {
        userId: user._id,
        audit: Auth.contains(user, config.auth.articleMgtAudit),
        resetOpt: {
            imgHost: opt.myData.imgHost,
            user,
        }
    });
    return rs;
};

/**
 * @api {post} /article/mgt/save mgt save
 * @apiGroup article
 * @apiParamClass (src/valid-schema/class-valid/article.ts) {AritcleSave}
 */
export let mgtSave: MyRequestHandler = async (opt, ctx) => {
    let user = opt.myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.ArticleSave);
    let detail = await ArticleMapper.mgtSave(data, { user });
    return {
        _id: detail._id
    };
};

export let mgtDel: MyRequestHandler = async (opt, ctx) => {
    let user = opt.myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.ArticleDel);
    await ArticleMapper.updateStatus({
        cond: {
            idList: data.idList,
            status: { $ne: myEnum.articleStatus.已删除 },
            includeUserId: Auth.contains(user, config.auth.articleMgtDel) ? null : user._id,
        },
        toStatus: myEnum.articleStatus.已删除, user,
        logRemark: data.remark,
    });
};

export let mgtAudit: MyRequestHandler = async (opt, ctx) => {
    let user = opt.myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.ArticleMgtAudit);
    let rs = await ArticleMapper.updateStatus({
        cond: {
            idList: data.idList,
            status: myEnum.articleStatus.待审核,
        },
        toStatus: data.status, user,
        logRemark: data.remark,
    });
    return rs;
};


export let query: MyRequestHandler = async (opt, ctx) => {
    let user = opt.myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.ArticleQuery);

    let { rows, total } = await ArticleMapper.query(data, {
        normal: true,
        resetOpt: {
            imgHost: opt.myData.imgHost,
            user: user.isLogin ? user : null,
        }
    });
    return {
        rows,
        total
    };
};

export let detailQuery: MyRequestHandler = async (opt, ctx) => {
    let user = opt.myData.user;
    let data = paramsValid(opt.reqData, ValidSchema.ArticleDetailQuery);
    let rs = await ArticleMapper.detailQuery({ _id: data._id }, {
        normal: true,
        resetOpt: {
            imgHost: opt.myData.imgHost,
            user: user.isLogin ? user : null,
        }
    });
    let detail = rs.detail;
    ContentMapper.contentView({ detail, model: ArticleModel, user, type: myEnum.contentType.文章 });
    return rs;
};