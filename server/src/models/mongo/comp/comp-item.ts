import {
  getModelForClass, ModelType, DocType, InstanceType,
  setSchema, prop, arrayProp, setPlugin
} from 'mongoose-ts-ua';
import { Types, SchemaTypes } from 'mongoose';

import { Base } from '../_base';


export type CompItemInstanceType = InstanceType<CompItem>;
export type CompItemModelType = ModelType<CompItem, typeof CompItem>;
export type CompItemDocType = DocType<CompItemInstanceType>;

@setSchema({
  schemaOptions: {
    toJSON: {
      virtuals: true
    }
  }
})
export class CompItem extends Base {
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
  disabled: boolean

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
  queryMode: string

  @prop()
  calcType: string

  @prop()
  sort: number;
}

export const CompItemModel = getModelForClass<CompItem, typeof CompItem>(CompItem);

