import { escapeRegExp } from '@/_system/common';
import * as ValidSchema from '@/valid-schema/class-valid';

import { BaseMapper } from '../_base';
import { AssetLogModel } from './asset-log';

export class AssetLogMapper {
    static lookupPipeline(opt?: {
        assetLogIdKey?: string;
        asName?: string;
        match?: object;
    }) {
        opt = {
            ...opt
        };
        let asName = opt.asName || 'assetLog';
        return [
            {
                $lookup: {
                    from: AssetLogModel.collection.collectionName,
                    let: { assetLogId: '$' + (opt.assetLogIdKey || 'assetLogId') },
                    pipeline: [{
                        $match: {
                            ...opt.match,
                            $expr: { $eq: ['$$assetLogId', '$_id'] }
                        }
                    }],
                    as: asName
                }
            },
            { $unwind: '$' + asName },
        ];
    }

    static async query(data: ValidSchema.AssetLogQuery) {
        let match: any = {};
        if (data.orderNo)
            match.orderNo = new RegExp(escapeRegExp(data.orderNo), 'i');
        if (data.outOrderNo)
            match.outOrderNo = new RegExp(escapeRegExp(data.outOrderNo), 'i');
        if (data.status)
            match.status = { $in: data.status.split(',') };

        return await AssetLogModel.findAndCountAll({
            conditions: match,
            ...BaseMapper.getListOptions(data)
        });
    }
}