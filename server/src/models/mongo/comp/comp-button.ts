import {
  getModelForClass, ModelType, DocType, InstanceType,
  setSchema, prop, arrayProp, setPlugin
} from 'mongoose-ts-ua';
import { Types, SchemaTypes } from 'mongoose';

import { Base } from '../_base';


export type CompButtonInstanceType = InstanceType<CompButton>;
export type CompButtonModelType = ModelType<CompButton, typeof CompButton>;
export type CompButtonDocType = DocType<CompButtonInstanceType>;

@setSchema({
  schemaOptions: {
    toJSON: {
      virtuals: true
    }
  }
})
export class CompButton extends Base {
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
    
    @prop({
      trim: true,
    })
    group: string;
    
    @prop()
    sort: number;
}

export const CompButtonModel = getModelForClass<CompButton, typeof CompButton>(CompButton);

