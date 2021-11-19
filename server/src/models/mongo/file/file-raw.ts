import { Types, SchemaTypes } from 'mongoose';
import { setSchema, prop, setMethod, getModelForClass, InstanceType } from 'mongoose-ts-ua';

import { Base } from '../_base';

export type FileRawInstance = InstanceType<FileRaw>  

@setSchema()
class FileRaw extends Base {
  @prop()
  length: number

  @prop()
  md5: string;

  @prop()
  contentType: string;

  @prop()
  filename: string;
}

export const FileRawModel = getModelForClass<FileRaw, typeof FileRaw>(FileRaw);