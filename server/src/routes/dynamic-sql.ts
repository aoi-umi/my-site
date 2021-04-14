import { MyRequestHandler } from '@/middleware/my-request-handler';
import * as main from '@/main';

export let exec: MyRequestHandler = async (opt) => {
  let { reqData } = opt;
  let rs = await main.sequelize.queryByConfig(reqData);
  return rs;
};