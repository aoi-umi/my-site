import { ClassType } from 'class-transformer/ClassTransformer';
import { Types } from 'mongoose';

export function arrayTransform(value: any, cls: ClassType<any>) {
    return value instanceof Array ? value.map(ele => new cls(ele)) : value;
}

export function objectIdTransform(value) {
    return value ? Types.ObjectId(value) : void 0;
}