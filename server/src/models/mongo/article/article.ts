import {
    getModelForClass, ModelType, DocType, InstanceType,
    setSchema, prop, arrayProp
} from 'mongoose-ts-ua';

import { myEnum } from '@/config';
import { ContentBase } from '../content/content-base';
import { IPagination } from '../_plugins/pagination';

export type ArticleInstanceType = InstanceType<Article>;
export type ArticleModelType = ModelType<Article, typeof Article>;
export type ArticleDocType = DocType<ArticleInstanceType>;
@setSchema({
    schemaOptions: {
        toJSON: {
            virtuals: true
        }
    }
})
export class Article extends ContentBase {
    @prop({
        required: true,
    })
    content: string;

    @prop({
        enum: myEnum.articleContentType.getAllValue(),
        default: myEnum.articleContentType.默认,
    })
    contentType: number;

    @prop({
        enum: myEnum.articleStatus.getAllValue(),
        required: true
    })
    status: number;

    @prop()
    get statusText() {
        return myEnum.articleStatus.getKey(this.status);
    }

    @prop()
    get canUpdate() {
        return [myEnum.articleStatus.草稿, myEnum.articleStatus.审核不通过, myEnum.articleStatus.审核通过].includes(this.status);
    }

    @prop()
    get canDel() {
        return ![myEnum.articleStatus.已删除].includes(this.status);
    }
}

export const ArticleModel = getModelForClass<Article, typeof Article & IPagination<Article>>(Article);

