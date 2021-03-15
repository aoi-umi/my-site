
import errorConfig from './errorConfig';
export type AuthConfigType = {
    code: string;
    errCode?: ErrorConfigType;
}
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

    userMgtQuery: {
        code: 'userMgtQuery',
    },
    userMgtEdit: {
        code: 'userMgtEdit',
    },
    userMgtDisable: {
        code: 'userMgtDisable',
    },

    roleQuery: {
        code: 'roleQuery',
    },
    roleSave: {
        code: 'roleSave',
    },
    roleDel: {
        code: 'roleDel',
    },
    authorityQuery: {
        code: 'authorityQuery',
    },
    authoritySave: {
        code: 'authorityQuery',
    },
    authorityDel: {
        code: 'authorityDel',
    },

    articleMgtDel: {
        code: 'articleMgtDel'
    },
    articleMgtAudit: {
        code: 'articleMgtAudit'
    },

    videoMgtDel: {
        code: 'videoMgtDel'
    },
    videoMgtAudit: {
        code: 'videoMgtAudit'
    },

    commentMgtDel: {
        code: 'commentMgtDel'
    },

    goodsMgtAudit: {
        code: 'goodsMgtAudit'
    },

    payMgtQuery: {
        code: 'payMgtQuery'
    },
    payMgtOperate: {
        code: 'payMgtOperate'
    },

    settingQuery: {
        code: 'settingQuery'
    },
    settingSave: {
        code: 'settingSave'
    },
};

export default authConfig;