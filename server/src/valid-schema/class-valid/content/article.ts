import { IsDefined, MinLength, IsIn } from 'class-validator';

import { myEnum } from '@/dev-config';
import {
  ContentQuery,
  ContentDetailQuery,
  ContentSave,
  ContentDel,
  ContentMgtAudit,
  ContentMgtRecovery,
} from './content';

export class ArticleQuery extends ContentQuery {}

export class ArticleDetailQuery extends ContentDetailQuery {}

export class ArticleSave extends ContentSave {
  @IsDefined()
  @MinLength(1)
  content: string;

  @IsDefined()
  @IsIn(myEnum.articleContentType.getAllValue())
  contentType: number;
}

export class ArticleDel extends ContentDel {}

export class ArticleMgtAudit extends ContentMgtAudit {}

export class ArticleMgtRecovery extends ContentMgtRecovery {}
