
import { Types } from 'mongoose';
import * as mathjs from 'mathjs';

import * as config from '@/config';
import { myEnum } from '@/config';
import * as ValidSchema from '@/valid-schema/class-valid';
import { error, escapeRegExp } from '@/_system/common';
import { transaction } from '@/_system/dbMongo';
import { LoginUser } from '@/models/login-user';

import { GoodsSpuModel, GoodsSpuInstanceType } from './goods-spu';
import { GoodsSpecGroupModel, GoodsSpecGroupInstanceType } from './goods-spec-group';
import { GoodsSkuModel, GoodsSkuInstanceType } from './goods-sku';
import { BaseMapper } from '../_base';
import { FileMapper } from '../file';
import { PayMapper } from '../asset';

class DetailDataType {
    spu: GoodsSpuInstanceType;
    specGroup: GoodsSpecGroupInstanceType[];
    sku: GoodsSkuInstanceType[];
};

type SpuResetType = {
    imgHost?: string;
    user: LoginUser
};

class Detail extends DetailDataType {
    constructor(data: DetailDataType) {
        super();
        this.spu = data.spu;
        this.specGroup = data.specGroup;
        this.sku = data.sku;
    }

    toJSON() {
        return {
            spu: this.spu.toJSON(),
            specGroup: this.specGroup.map(e => e.toJSON()),
            sku: this.sku.map(e => e.toJSON()),
        };
    }
}

export class GoodsMapper {
    static async mgtSave(data: ValidSchema.GoodsMgtSave, opt: {
        user: LoginUser
    }) {
        let { user } = opt;
        let detail: DetailDataType;
        let delGroupId = [], delSkuId = [], oldSku: GoodsSkuInstanceType[] = [];
        if (data.spu._id) {
            detail = await GoodsMapper.detailQuery({ _id: data.spu._id });
            delGroupId = detail.specGroup.map(ele => ele._id);
            oldSku = detail.sku;
            delSkuId = oldSku.map(ele => ele._id);
        } else {
            let spu = new GoodsSpuModel({ _id: data.spu._id });
            detail = {
                spu,
            } as any;
        }

        ['name', 'typeIds', 'profile', 'imgs', 'status', 'putOnAt', 'expireAt'].forEach(key => {
            detail.spu[key] = data.spu[key];
        });
        detail.spu.userId = user._id;
        if (!detail.spu.putOnAt)
            detail.spu.putOnAt = new Date();

        detail.specGroup = data.specGroup.map(ele => {
            ele._id = Types.ObjectId();
            let obj = new GoodsSpecGroupModel(ele);
            obj.spuId = detail.spu._id;
            return obj;
        });

        detail.sku = data.sku.map(ele => {
            if (ele._id) {
                let match = oldSku.find(s => s._id.equals(ele._id));
                if (match) {
                    ['saleQuantity'].forEach(key => {
                        ele[key] = match[key];
                    });
                }
            } else {
                ele._id = Types.ObjectId();
            }
            let obj = new GoodsSkuModel(ele);
            obj.spuId = detail.spu._id;
            obj.name = ele.spec.join('');
            return obj;
        });

        await transaction(async (session) => {
            if (delGroupId.length)
                await GoodsSpecGroupModel.deleteMany({ _id: delGroupId }, { session });
            if (delSkuId.length)
                await GoodsSkuModel.deleteMany({ _id: delSkuId }, { session });
            await detail.spu.save({ session });
            await GoodsSpecGroupModel.insertMany(detail.specGroup.map(ele => ele.toObject()), { session });
            await GoodsSkuModel.insertMany(detail.sku.map(ele => ele.toObject()), { session });
        });
        return detail;
    }

    static async detailQuery(data: ValidSchema.GoodsMgtDetailQuery, opt?: { normal?: boolean }) {
        opt = {
            ...opt
        };
        let spu = await GoodsSpuModel.findOne({ _id: data._id });
        if (!spu)
            throw error('', config.error.DB_NO_DATA);
        if (opt.normal && !spu.canView())
            throw error('', config.error.NO_PERMISSIONS);
        let specGroup = await GoodsSpecGroupModel.find({ spuId: spu._id });
        let sku = await GoodsSkuModel.find({ spuId: spu._id });
        let rs = {
            spu,
            specGroup,
            sku
        };
        return new Detail(rs);
    }

    static async query(data: ValidSchema.GoodsMgtQuery, opt: {
        audit?: boolean;
        normal?: boolean;
        user: LoginUser,
        resetOpt: SpuResetType,
    }) {
        let { user } = opt;
        let match: any = {};
        let and = [];
        if (data.name)
            match.name = new RegExp(escapeRegExp(data.name), 'i');
        if (data.anyKey) {
            let anykey = new RegExp(escapeRegExp(data.anyKey), 'i');
            and = [...and, {
                $or: [{
                    name: anykey
                }, {
                    profile: anykey
                }]
            }];
        }

        if (opt.normal) {
            let now = new Date();
            match.status = myEnum.goodsStatus.上架;
            match.putOnAt = { $lte: now };
            and = [...and, {
                $or: [{
                    expireAt: null
                }, {
                    expireAt: { $gt: now }
                }]
            }];
        } else {
            if (data.status)
                match.status = { $in: data.status.split(',') };
            if (!opt.audit) {
                match.userId = user._id;
            }
        }
        if (and.length)
            match.$and = and;
        let orderBy = data.orderBy;
        if (['saleQuantity', 'price'].includes(orderBy)) {
            orderBy = 'skuGroup.' + orderBy;
        }
        let rs = await GoodsSpuModel.aggregatePaginate<{
            skuGroup: any
        }>([
            { $match: match },
            {
                $lookup: {
                    from: GoodsSkuModel.collection.collectionName,
                    let: { spuId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$spuId', '$$spuId'] } } },
                        { $sort: { price: -1 } },
                        {
                            $group: {
                                _id: null,
                                saleQuantity: {
                                    $sum: '$saleQuantity'
                                },
                                price: { $first: '$price' }
                            }
                        }
                    ],
                    as: 'skuGroup'
                }
            },
            { $unwind: '$skuGroup' },
        ], {
            ...BaseMapper.getListOptions(data),
            orderBy,
        });
        return {
            rows: rs.rows.map(ele => {
                let obj = new GoodsSpuModel(ele).toJSON();
                ['saleQuantity', 'price'].forEach(key => {
                    obj[key] = ele.skuGroup[key];
                });
                this.resetSpu(obj, opt.resetOpt);
                return obj;
            }),
            total: rs.total
        };
    }

    static resetSpu(detail, opt: SpuResetType) {
        if (opt.imgHost) {
            detail.imgUrls = detail.imgs.map(ele => {
                return FileMapper.getImgUrl(ele, opt.imgHost);
            });
        }
        detail.canUpdate = detail.canUpdate && opt.user.equalsId(detail.userId);
        detail.canDel = detail.canDel && opt.user.equalsId(detail.userId);
    }

    static resetDetail(detail, opt: SpuResetType) {
        this.resetSpu(detail.spu, opt);
        detail.sku.forEach(e => {
            e.imgUrls = e.imgs.map(img => FileMapper.getImgUrl(img, opt.imgHost));
        });
    }

    static async updateStatus(opt: {
        cond: {
            idList: Types.ObjectId[],
            status?: any;
            includeUserId?: Types.ObjectId | string;
        };
        toStatus: number;
        user: LoginUser
    }) {
        let { user, toStatus } = opt;
        let { idList, includeUserId, status } = opt.cond;
        let cond: any = { _id: { $in: idList } };
        if (status !== undefined)
            cond.status = status;
        if (includeUserId)
            cond.userId = Types.ObjectId(includeUserId as any);
        let list = await GoodsSpuModel.find(cond);
        if (!list.length)
            throw error('', config.error.NO_MATCH_DATA);
        let bulk = [];
        for (let detail of list) {
            if (detail.status === toStatus)
                continue;
            let update: any = { status: toStatus };
            bulk.push({
                updateOne: {
                    filter: { ...cond, _id: detail._id },
                    update: {
                        $set: update
                    }
                }
            });
        }

        if (!bulk.length)
            return;
        await GoodsSpuModel.bulkWrite(bulk);
    }

    static async buy(data: ValidSchema.GoodsBuy, opt: { user: LoginUser }) {
        let sku = await GoodsSkuModel.findOne({ _id: data.skuId });
        if (!sku)
            throw error('', config.error.DB_NO_DATA);
        if (sku.status !== myEnum.goodsSkuStatus.上架)
            throw error('商品已下架');
        if (sku.quantity - data.quantity < 0) {
            throw error(`${sku.name}库存不足`);
        }
        let totalPrice = mathjs.round(data.quantity * sku.price, 2) as number;
        if (totalPrice !== data.totalPrice)
            throw error('总价不一致', null, { remark: `c:${data.totalPrice};s:${totalPrice}` });
        let { spu } = await GoodsMapper.detailQuery({ _id: sku.spuId }, { normal: true });

        let name = spu.name + sku.name;
        let payRs = await PayMapper.create({
            money: totalPrice,
            type: data.payType,
            title: name,
            content: name + ' * ' + data.quantity,
        }, {
            user: opt.user,
            contactType: myEnum.payContactType.商品,
            contactObj: { skuId: sku._id, quantity: data.quantity }
        });
        await sku.update({ saleQuantity: sku.saleQuantity + data.quantity });
        return payRs;
    }
}