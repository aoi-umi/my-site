import {
    getModelForClass, ModelType, DocType, InstanceType,
    setSchema, prop, arrayProp, setPlugin
} from 'mongoose-ts-ua';

import { Base } from '../_base';
import { pagination, IPagination } from '../_plugins/pagination';

export type BookmarkInstanceType = InstanceType<Bookmark>;
export type BookmarkModelType = ModelType<Bookmark, typeof Bookmark>;
export type BookmarkDocType = DocType<BookmarkInstanceType>;
@setSchema({
    schemaOptions: {}
})
@setPlugin(pagination)
export class Bookmark extends Base {
    @prop()
    name: string;

    @prop()
    url: string;

    @arrayProp({
        type: String
    })
    tagList: string[];
}

export const BookmarkModel = getModelForClass<Bookmark, typeof Bookmark & IPagination<Bookmark>>(Bookmark);

