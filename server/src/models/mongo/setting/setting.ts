import {
    getModelForClass, ModelType, DocType, InstanceType,
    setSchema, prop, arrayProp, setMethod
} from 'mongoose-ts-ua';
import { Types, SchemaTypes } from 'mongoose';

import { myEnum } from '@/config';

import { Base } from '../_base';

export type SettingInstanceType = InstanceType<Setting>;
export type SettingModelType = ModelType<Setting, typeof Setting>;
export type SettingDocType = DocType<SettingInstanceType>;
@setSchema({
    schemaOptions: {
        toJSON: {
            virtuals: true
        }
    }
})
export class Setting extends Base {
    /**
     * 开放注册
     */
    @prop({
        default: myEnum.settingSignUpType.开放,
        enum: myEnum.settingSignUpType.getAllValue()
    })
    signUpType: number;

    @prop()
    signUpFrom: Date;

    @prop()
    signUpTo: Date;

    @setMethod
    getCanSignUp() {
        let now = Date.now();
        let inTime = (!this.signUpFrom || this.signUpFrom && this.signUpFrom.getTime() <= now)
            && (!this.signUpTo || this.signUpTo && this.signUpTo.getTime() >= now);
        switch (this.signUpType) {
        case myEnum.settingSignUpType.开放:
        default:
            return true;
        case myEnum.settingSignUpType.限时开放:
            return inTime;
        case myEnum.settingSignUpType.关闭:
            return false;
        case myEnum.settingSignUpType.限时关闭:
            return !inTime;
        }
    }
    
    @prop()
    get canSignUp() {
        return this.getCanSignUp();
    }

    @prop({
        type: SchemaTypes.ObjectId,
        required: true
    })
    operatorId: Types.ObjectId;
}

export const SettingModel = getModelForClass<Setting, typeof Setting>(Setting);