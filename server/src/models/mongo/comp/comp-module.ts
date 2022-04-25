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

import { Base } from '../_base';

export type CompModuleInstanceType = InstanceType<CompModule>;
export type CompModuleModelType = ModelType<CompModule, typeof CompModule>;
export type CompModuleDocType = DocType<CompModuleInstanceType>;

@setSchema({
  schemaOptions: {
    toJSON: {
      virtuals: true,
    },
  },
})
export class CompModule extends Base {
  @prop({
    type: SchemaTypes.ObjectId,
    required: true,
  })
  compId: Types.ObjectId;

  @prop({
    required: true,
    trim: true,
  })
  name: string;

  @prop({
    required: true,
    trim: true,
  })
  text: string;

  @prop()
  disabled: boolean;

  @prop({
    trim: true,
  })
  viewType: string;

  @prop({
    trim: true,
  })
  group: string;

  @prop()
  sort: number;
}

export const CompModuleModel = getModelForClass<CompModule, typeof CompModule>(
  CompModule,
);
