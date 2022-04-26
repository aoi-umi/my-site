import { LoginUser } from '../../login-user';
import { ContentLog, ContentLogModel } from './content-log';
import { ContentBaseInstanceType } from './content-base';
import { myEnum } from '@/dev-config';

export class ContentLogMapper {
  static create(
    content: ContentBaseInstanceType,
    user: LoginUser,
    opt: {
      contentType: number;
      srcStatus: number;
      destStatus: number;
      remark?: string;
      operate?: string;
    },
  ) {
    let log = new ContentLogModel({
      contentId: content._id,
      contentType: opt.contentType,
      userId: user._id,
      srcStatus: opt.srcStatus,
      destStatus: opt.destStatus,
      logUser: user.nameToString(),
    });
    let op = myEnum.contentOperate.getKey(opt.operate);
    log.remark =
      opt.remark ||
      op ||
      log.getStatusText(log.srcStatus) +
        '=>' +
        log.getStatusText(log.destStatus);
    return log;
  }
}
