import { Transform, Type } from 'class-transformer';
import { IsDefined, IsIn, IsArray, ArrayMinSize, ValidateNested, IsInt, Min } from 'class-validator';
import { Types } from 'mongoose';
import { myEnum } from '@/config';
import { objectIdTransform } from './util';
import { DetailQueryBase, ListBase, DelBase } from './base';

class Spu {
    @Transform(objectIdTransform)
    _id: Types.ObjectId;

    @IsDefined()
    name: string;

    @IsDefined()
    profile: string;

    @IsDefined()
    @IsArray()
    @ArrayMinSize(1)
    imgs: string[];

    @IsDefined()
    @IsIn(myEnum.goodsStatus.getAllValue())
    @Type()
    status: number;

    putOnAt?: Date;

    expireAt?: Date;
}

class SpecGroup {
    _id?: string | Types.ObjectId;

    @IsDefined()
    name: string;

    @IsDefined()
    @IsArray()
    @ArrayMinSize(1)
    value: string[];
}

class Sku {
    _id?: string | Types.ObjectId;

    @IsDefined()
    spec: string[];

    // @IsDefined()
    code: string;

    @IsDefined()
    @IsIn(myEnum.goodsSkuStatus.getAllValue())
    @Type()
    status: number;

    @IsDefined()
    @Type()
    price: number;

    @IsDefined()
    @Type()
    quantity: number;

    imgs: string[];
}

export class GoodsMgtSave {
    @ValidateNested()
    @IsDefined()
    @Type(() => Spu)
    spu: Spu;

    @ValidateNested()
    @IsDefined()
    @IsArray()
    @ArrayMinSize(1)
    @Type(() => SpecGroup)
    specGroup: SpecGroup[];

    @ValidateNested()
    @IsDefined()
    @IsArray()
    @ArrayMinSize(1)
    @Type(() => Sku)
    sku: Sku[];
}

export class GoodsMgtDetailQuery extends DetailQueryBase {
}

export class GoodsMgtQuery extends ListBase {
    status: string;
    name: string;
    anyKey: string;
}

export class GoodsMgtDel extends DelBase {
}

export class GoodsDetailQuery extends GoodsMgtDetailQuery {
}

export class GoodsQuery extends GoodsMgtQuery {
}

export class GoodsBuy {
    @IsDefined()
    @Transform(objectIdTransform)
    skuId: Types.ObjectId;

    @IsDefined()
    @IsIn(myEnum.assetSourceType.getAllValue())
    @Type()
    payType: number;

    @Min(1)
    @IsInt()
    @IsDefined()
    @Type()
    quantity: number;

    @Min(0)
    @IsDefined()
    @Type()
    totalPrice: number;
}