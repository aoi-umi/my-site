import { IsArray, IsDefined, ArrayMinSize, MinLength, IsIn } from 'class-validator';
import { Types } from 'mongoose';
import { Type, Transform } from 'class-transformer';

import { myEnum } from '@/config';

import { arrayTransform } from '../util';
import {
    ContentQuery, ContentDetailQuery,
    ContentSave, ContentDel, ContentMgtAudit
} from './content';

export class VideoQuery extends ContentQuery {
}

export class VideoDetailQuery extends ContentDetailQuery {
}

export class VideoSave extends ContentSave {
    @IsDefined()
    @IsArray()
    @ArrayMinSize(1)
    @Transform(value => {
        return arrayTransform(value, Types.ObjectId);
    })
    videoIdList: Types.ObjectId[];
}

export class VideoDel extends ContentDel {
}

export class VideoMgtAudit extends ContentMgtAudit {
    @IsIn([myEnum.videoStatus.审核通过, myEnum.videoStatus.审核不通过])
    status: number;
}