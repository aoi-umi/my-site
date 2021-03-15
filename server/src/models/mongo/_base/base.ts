import {
    Model, ModelType, DocType, InstanceType,
    setSchema, setStatic,
} from 'mongoose-ts-ua';

export type BaseInstanceType = InstanceType<Base>;
export type BaseModelType = ModelType<Base, typeof Base>;
export type BaseDocType = DocType<BaseInstanceType>;
@setSchema()
export class Base extends Model<Base> {
    
}
