import {
  getModelForClass, ModelType, DocType, InstanceType,
  setSchema, prop, arrayProp, setPlugin
} from 'mongoose-ts-ua';
import { Types, SchemaTypes } from 'mongoose';

import { Base } from '../_base';


export type CompConfigInstanceType = InstanceType<CompConfig>;
export type CompConfigModelType = ModelType<CompConfig, typeof CompConfig>;
export type CompConfigDocType = DocType<CompConfigInstanceType>;

@setSchema({
  schemaOptions: {
    toJSON: {
      virtuals: true
    }
  }
})
export class CompConfig extends Base {
  @prop({
    type: SchemaTypes.ObjectId,
    required: true
  })
  compId: Types.ObjectId;

  @prop({
    type: SchemaTypes.ObjectId,
    required: true
  })
  moduleId: Types.ObjectId;

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
  editable: boolean

  @prop()
  remark: string

  @prop()
  type: string

  @prop({
    trim: true
  })
  options: string

  @prop()
  optionType: string

  @prop()
  isRange: boolean

  @prop()
  required: boolean

  @prop()
  disabled: boolean

  @prop()
  queryMode: string

  @prop()
  calcType: string

  @prop()
  sort: number;
}

export const CompConfigModel = getModelForClass<CompConfig, typeof CompConfig>(CompConfig);

