import {
  getModelForClass,
  ModelType,
  DocType,
  InstanceType,
  setSchema,
  prop,
  arrayProp,
  setPlugin,
  getSchema,
} from 'mongoose-ts-ua';
import { Types, SchemaTypes } from 'mongoose';

import { myEnum } from '@/dev-config/enum';

import { Base } from '../_base';
import { pagination, IPagination } from '../_plugins/pagination';

export type OauthInstanceType = InstanceType<Oauth>;
export type OauthModelType = ModelType<Oauth, typeof Oauth>;
export type OauthDocType = DocType<OauthInstanceType>;
@setSchema({
  schemaOptions: {
    toJSON: {
      virtuals: true,
    },
  },
})
export class Oauth extends Base {
  @prop({
    required: true,
    enum: myEnum.oauthName.getAllValue(),
  })
  name: string;

  @prop({
    required: true,
  })
  id: string;

  @prop({
    required: true,
  })
  userId: Types.ObjectId;
}

let schema = getSchema(Oauth);
schema.index({ name: 1, id: 1, userId: 1 }, { unique: true });

export const OauthModel = getModelForClass<Oauth, typeof Oauth>(Oauth);
