import {
    getModelForClass, ModelType, DocType, InstanceType,
    setSchema, prop, arrayProp, getSchema, setPlugin
} from 'mongoose-ts-ua';
import { Types, SchemaTypes } from 'mongoose';

import { myEnum } from '@/config/enum';

import { ContentContactBase } from '../content/content-contact';
import { pagination, IPagination } from '../_plugins/pagination';

type favourite = typeof Favourite & IPagination<Favourite>;
export type FavouriteInstanceType = InstanceType<Favourite>;
export type FavouriteModelType = ModelType<Favourite, favourite>;
export type FavouriteDocType = DocType<FavouriteInstanceType>;
@setSchema()
export class Favourite extends ContentContactBase {
    @prop({
        required: true,
    })
    favourite: boolean;

    @prop()
    favourAt: Date;
}

let schema = getSchema(Favourite);
schema.index({ ownerId: 1, userId: 1 }, { unique: true });

export const FavouriteModel = getModelForClass<Favourite, favourite>(Favourite);

export interface IFavouriteOwner {
    favourite: number;
}