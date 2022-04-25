import * as common from '@/_system/common';
import { env } from '@/dev-config';

type AuthRes = {
  access_token: string;
  token_type: string;
  scope: string;
};
const accessToken = async (reqData: { code: string }) => {
  let rs = await common.requestService({
    url: 'https://github.com/login/oauth/access_token',
    method: 'POST',
    params: {
      code: reqData.code,
      client_id: env.github.clientId,
      client_secret: env.github.clientSecret,
    },
  });
  return rs.data as {
    access_token: string;
    token_type: string;
    scope: string;
  };
};

const getUser = async (reqData: AuthRes) => {
  let rs = await common.requestService({
    url: 'https://api.github.com/user',
    method: 'GET',
    headers: {
      Authorization: `${reqData.token_type} ${reqData.access_token}`,
    },
  });
  return rs.data as {
    login: string;
    id: string;
    avatar_url: string;
  };
};

export const githubInst = {
  getUser: async (reqData: { code: string }) => {
    let tokenRs = await accessToken(reqData);
    let user = await getUser(tokenRs);
    return user;
  },
};
