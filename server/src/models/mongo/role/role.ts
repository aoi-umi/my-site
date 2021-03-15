import {
    getModelForClass, ModelType, DocType, InstanceType,
    setSchema, prop, arrayProp, setPlugin
} from 'mongoose-ts-ua';

import { myEnum } from '@/config/enum';

import { Base } from '../_base';
import { pagination, IPagination } from '../_plugins/pagination';

export type RoleInstanceType = InstanceType<Role>;
export type RoleModelType = ModelType<Role, typeof Role>;
export type RoleDocType = DocType<RoleInstanceType>;
@setSchema({
    schemaOptions: {
        toJSON: {
            virtuals: true
        }
    }
})
@setPlugin(pagination)
export class Role extends Base {
    @prop({
        required: true,
        trim: true,
    })
    name: string;

    @prop({
        required: true,
        trim: true,
        index: {
            unique: true
        }
    })
    code: string;

    @prop({
        enum: myEnum.roleStatus.getAllValue(),
        default: myEnum.roleStatus.启用,
    })
    status: number;

    @prop()
    get statusText() {
        return myEnum.roleStatus.getKey(this.status);
    }

    @arrayProp({
        type: String,
    })
    authorityList: string[];
}

export const RoleModel = getModelForClass<Role, typeof Role & IPagination<Role>>(Role);

