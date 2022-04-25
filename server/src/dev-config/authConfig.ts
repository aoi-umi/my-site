import errorConfig from './errorConfig';
export type AuthConfigType = {
  code: string;
  errCode?: ErrorConfigType;
};

export const dbAuthority = {
  authorityQuery: {
    name: '权限查询',
  },
  authoritySave: {
    name: '权限修改',
  },
  authorityDel: {
    name: '权限删除',
  },

  roleQuery: {
    name: '角色查询',
  },
  roleSave: {
    name: '角色修改',
  },
  roleDel: {
    name: '角色删除',
  },

  userMgtQuery: {
    name: '用户管理查询',
  },
  userMgtEdit: {
    name: '用户管理修改',
  },
  userMgtDisable: {
    name: '用户管理封禁',
  },

  articleMgtDel: {
    name: '文章管理删除',
  },
  articleMgtAudit: {
    name: '文章管理审核',
  },
  articleMgtRecovery: {
    name: '文章管理恢复',
  },

  videoMgtDel: {
    code: '视频管理删除',
  },
  videoMgtAudit: {
    name: '视频管理审核',
  },
  videoMgtRecovery: {
    name: '视频管理恢复',
  },

  commentMgtDel: {
    name: '评论管理删除',
  },

  goodsMgtAudit: {
    name: '商品管理审核',
  },

  payMgtQuery: {
    name: '支付管理查询',
  },
  payMgtOperate: {
    name: '支付管理操作',
  },
  settingQuery: {
    name: '设置查询',
  },
  settingSave: {
    name: '设置修改',
  },
  fileMgtQuery: {
    name: '文件管理查询',
  },
  fileMgtDel: {
    name: '文件管理删除',
  },
  fileMgtRecovery: {
    name: '文件管理恢复',
  },
};

Object.entries(dbAuthority).forEach(([key, value]) => {
  value['code'] = key;
});

export const authConfig = {
  dev: {
    code: 'dev',
    errCode: errorConfig.DEV,
  },
  local: {
    code: 'local',
    errCode: errorConfig.NO_PERMISSIONS,
  },
  login: {
    code: 'login',
    errCode: errorConfig.NO_LOGIN,
  },
  accessable: {
    code: 'accessable',
    errCode: errorConfig.NO_PERMISSIONS,
  },
  admin: {
    code: 'admin',
    errCode: errorConfig.NO_PERMISSIONS,
  },

  ...(dbAuthority as any as {
    [key in keyof typeof dbAuthority]: AuthConfigType;
  }),
};

export default authConfig;
