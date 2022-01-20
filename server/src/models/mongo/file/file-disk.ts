import { Types, SchemaTypes } from 'mongoose';
import { setSchema, prop, setMethod, getModelForClass, InstanceType, setPlugin } from 'mongoose-ts-ua';

import { Base } from '../_base';
import { pagination, IPagination } from '../_plugins/pagination';

export type FileDiskInstance = InstanceType<FileDisk>  

@setSchema()
@setPlugin(pagination)
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

export const FileDiskModel = getModelForClass<FileDisk, typeof FileDisk & IPagination<FileDisk>>(FileDisk);