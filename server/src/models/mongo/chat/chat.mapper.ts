import { Model, InstanceType } from 'mongoose-ts-ua';
import { Types } from 'mongoose';

import * as ValidSchema from '@/valid-schema/class-valid';
import { getObjectId } from '@/helpers';

import { UserMapper, UserResetOption } from '../user';
import { ChatModel } from './chat';

export class ChatMapper {
  static async query(
    data: ValidSchema.ChatQuery,
    opt: { userId: any } & UserResetOption,
  ) {
    let userId = getObjectId(opt.userId);
    let match: any = {
      $or: [
        {
          userId,
          destUserId: data.destUserId,
        },
        {
          destUserId: userId,
          userId: data.destUserId,
        },
      ],
    };
    if (data.lastId) match._id = { $lt: data.lastId };
    let rs = await ChatModel.aggregatePaginate(
      [
        {
          $match: match,
        },
      ],
      {
        rows: data.rows,
      },
    );

    rs.rows = rs.rows.reverse();
    return rs;
  }
}
