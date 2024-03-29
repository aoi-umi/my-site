import {
  getModelForClass,
  ModelType,
  DocType,
  InstanceType,
  setSchema,
  prop,
  arrayProp,
  setPlugin,
} from 'mongoose-ts-ua';
import { Types, SchemaTypes } from 'mongoose';

import { myEnum } from '@/dev-config/enum';

import { Base } from '../_base';
import { pagination, IPagination } from '../_plugins/pagination';

export type PrintInstanceType = InstanceType<Print>;
export type PrintModelType = ModelType<Print, typeof Print>;
export type PrintDocType = DocType<PrintInstanceType>;
@setSchema({
  schemaOptions: {
    toJSON: {
      virtuals: true,
    },
  },
})
@setPlugin(pagination)
export class Print extends Base {
  @prop({
    type: SchemaTypes.ObjectId,
  })
  userId: Types.ObjectId;

  @prop({
    required: true,
    trim: true,
    index: {
      unique: true,
    },
  })
  name: string;

  @prop({
    trim: true,
  })
  text: string;

  @prop({
    trim: true,
  })
  desc: string;

  @prop({
    required: true,
  })
  data: Object;
}

export const PrintModel = getModelForClass<
  Print,
  typeof Print & IPagination<Print>
>(Print);
