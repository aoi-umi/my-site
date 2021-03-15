import { Types } from 'mongoose';

import { dev } from '@/config';
import * as ValidSchema from '@/valid-schema/class-valid';

import { LoginUser } from '../../login-user';
import { ContentResetOption, ContentMapper } from '../content';
import { ViewHistoryModel } from './view-history';

export class ViewHistoryMapper {
    static async save(data: { ownerId: Types.ObjectId, type: number }, user: LoginUser) {
        let matchCond = { ownerId: data.ownerId, userId: user._id, type: data.type };
        let match = await ViewHistoryModel.findOne(matchCond);
        let update: any = { viewAt: new Date() };
        if (!match) {
            let cond = { userId: user._id };
            let count = await ViewHistoryModel.countDocuments(cond);
            if (count >= dev.maxViewHistoryCount) {
                match = await ViewHistoryModel.findOne(cond).sort({ viewAt: -1 });
                update.ownerId = data.ownerId;
                update.type = data.type;
            }
        }
        if (match)
            await match.update(update);
        else
            await ViewHistoryModel.create({ ...matchCond, viewAt: new Date() });
    }

    static async query(data: ValidSchema.ViewHistoryQuery, opt: ContentResetOption) {
        data.orderBy = 'viewAt';
        data.sortOrder = -1;
        let rs = await ContentMapper.mixQuery(data, {
            resetOpt: opt,
            ContentContactModel: ViewHistoryModel,
            merge: { viewAt: '$root.viewAt' }
        });
        return rs;
    }
}
