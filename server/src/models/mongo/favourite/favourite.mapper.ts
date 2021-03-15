import { Model, InstanceType } from 'mongoose-ts-ua';
import { Types } from 'mongoose';

import { myEnum } from '@/config';
import * as config from '@/config';
import { error } from '@/_system/common';
import * as ValidSchema from '@/valid-schema/class-valid';

import { ArticleModel } from '../article';
import { VideoModel } from '../video';
import { ContentBaseInstanceType, ContentResetOption, ContentMapper } from '../content';
import { FavouriteModel } from './favourite';

export class FavouriteMapper {
    static async create(opt: {
        ownerId,
        userId,
        type,
    }) {
        let detail = await FavouriteModel.findOne({ ownerId: opt.ownerId, userId: opt.userId });
        if (!detail) {
            detail = new FavouriteModel({
                ownerId: opt.ownerId,
                userId: opt.userId,
                type: opt.type,
                favourite: false
            });
        }
        return detail;
    }

    static async findOwner(opt: {
        ownerId,
        type,
    }) {
        let owner: ContentBaseInstanceType;
        if (opt.type == myEnum.voteType.文章) {
            owner = await ArticleModel.findOne({
                _id: opt.ownerId,
                status: myEnum.articleStatus.审核通过
            });
        } else if (opt.type == myEnum.voteType.视频) {
            owner = await VideoModel.findOne({
                _id: opt.ownerId,
                status: myEnum.videoStatus.审核通过
            });
        }
        if (!owner)
            throw error('', config.error.NO_MATCH_DATA);
        return owner;
    }

    static lookupPipeline(opt: {
        userId: any;
        ownerIdKey?: string;
    }) {
        return [
            {
                $lookup: {
                    from: FavouriteModel.collection.collectionName,
                    let: { ownerId: '$' + (opt.ownerIdKey || '_id') },
                    pipeline: [{
                        $match: {
                            userId: Types.ObjectId(opt.userId),
                            $expr: { $eq: ['$$ownerId', '$ownerId'] }
                        }
                    }],
                    as: 'favouriteDetail'
                }
            },
            { $unwind: { path: '$favouriteDetail', preserveNullAndEmptyArrays: true } },
        ];
    }

    static async query(data: ValidSchema.FavouriteQuery, opt: ContentResetOption) {
        let rs = await ContentMapper.mixQuery(data, {
            resetOpt: opt,
            ContentContactModel: FavouriteModel,
            merge: { favourAt: '$root.favourAt' }
        });
        let rows = rs.rows.map(ele => {
            let obj = ele as typeof ele & { favouriteValue: boolean };
            obj.favouriteValue = true;
            return obj;
        });
        return {
            ...rs,
            rows
        };
    }
}