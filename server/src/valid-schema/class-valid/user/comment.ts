import { Type } from 'class-transformer';
import { ListBase } from '../base';

export class UserCommentQuery extends ListBase {
  anyKey: string;

  @Type()
  isReply?: boolean;
}
