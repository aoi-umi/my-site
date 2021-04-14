import {
  getModelForClass, ModelType, DocType, InstanceType,
  setSchema, prop, arrayProp, setPlugin
} from 'mongoose-ts-ua';
import { Types, SchemaTypes } from 'mongoose';

import { Base } from '../_base';
import { pagination, IPagination } from '../_plugins/pagination';

export type CompInstanceType = InstanceType<Comp>;
export type CompModelType = ModelType<Comp, typeof Comp>;
export type CompDocType = DocType<CompInstanceType>;
@setSchema({
  schemaOptions: {
    toJSON: {
      virtuals: true
    }
  }
})
@setPlugin(pagination)
export class Comp extends Base {
    @prop({
      type: SchemaTypes.ObjectId,
    })
    userId: Types.ObjectId;
    
    @prop({
      required: true,
      trim: true,
    })
    name: string;
    
    @prop({
      trim: true, 
    })
    text: string;
    
    @prop()
    icon: string;
}

export const CompModel = getModelForClass<Comp, typeof Comp & IPagination<Comp>>(Comp);

