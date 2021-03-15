import { Transform, Type } from 'class-transformer';
import { IsDefined, MinLength, MaxLength, } from 'class-validator';
import { Types } from 'mongoose';
import { ListBase } from '../base';
import { objectIdTransform } from '../util';

export class ChatSubmit {
    @IsDefined()
    @Transform(objectIdTransform)
    destUserId: Types.ObjectId;

    @IsDefined()
    @MinLength(1)
    content: string;
}

export class ChatQuery extends ListBase {
    @Transform(objectIdTransform)
    lastId: Types.ObjectId;

    @IsDefined()
    @Transform(objectIdTransform)
    destUserId: Types.ObjectId;
}

export class ChatList extends ListBase {
}