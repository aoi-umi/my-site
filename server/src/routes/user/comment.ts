import { MyRequestHandler } from '@/middleware';
import { CommentMapper } from '@/models/mongo/comment';
import { paramsValid } from '@/helpers';
import * as ValidSchema from '@/valid-schema/class-valid';

export const query: MyRequestHandler = async (opt) => {
  let user = opt.myData.user;
  let data = paramsValid(opt.reqData, ValidSchema.UserCommentQuery);
  let { total, rows } = await CommentMapper.userCommentQuery({
    ...data,
  }, {
    user,
    resetOpt: {
      imgHost: opt.myData.imgHost,
    },
  });

  return {
    rows,
    total,
  };
};

export const replyQuery: MyRequestHandler = async (opt) => { };