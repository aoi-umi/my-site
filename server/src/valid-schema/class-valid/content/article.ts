import { IsDefined, MinLength, IsIn } from 'class-validator';

import { myEnum } from '@/config';
import {
    ContentQuery, ContentDetailQuery,
    ContentSave, ContentDel, ContentMgtAudit
} from './content';

export class ArticleQuery extends ContentQuery {
}

export class ArticleDetailQuery extends ContentDetailQuery {
}

export class ArticleSave extends ContentSave {
    @IsDefined()
    @MinLength(1)
    content: string;
    
    @IsDefined()
    @IsIn(myEnum.articleContentType.getAllValue())
    contentType: number;
}

export class ArticleDel extends ContentDel {
}

export class ArticleMgtAudit extends ContentMgtAudit {
    @IsIn([myEnum.articleStatus.审核通过, myEnum.articleStatus.审核不通过])
    status: number;
}