import { TransformOptions, Transform } from 'class-transformer';
import { Types } from 'mongoose';

function objectIdTransform(value) {
  return value ? new Types.ObjectId(value) : void 0;
}

export function TransformMongoId(options?: TransformOptions) {
  return (target: any, propertyKey: string) => {
    Transform((value, obj, transformationType) => {
      return objectIdTransform(obj[propertyKey]);
    }, options)(target, propertyKey);
  };
}
