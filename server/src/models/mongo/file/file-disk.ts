import { Types, SchemaTypes } from 'mongoose';
import { setSchema, prop, setMethod, getModelForClass, InstanceType } from 'mongoose-ts-ua';

import { Base } from '../_base';

export type FileDiskInstance = InstanceType<FileDisk>  

@setSchema()
class FileDisk extends Base {
  @prop()
  length: number

  @prop()
  md5: string;

  @prop()
  contentType: string;

  @prop()
  filename: string;

  @prop()
  isDel: boolean;
}

export const FileDiskModel = getModelForClass<FileDisk, typeof FileDisk>(FileDisk);