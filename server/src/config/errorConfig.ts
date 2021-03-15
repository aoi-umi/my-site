let errorConfig = {
    DEV: {
        code: 'DEV',
    },
    CODE_ERROR: {
        code: 'CODE_ERROR',
    },
    BAD_REQUEST: {
        code: 'BAD_REQUEST',
        status: 400,
    },
    NOT_FOUND: {
        code: 'NOT_FOUND',
        status: 404,
    },

    TOKEN_WRONG: {
        code: 'TOKEN_WRONG',
    },
    NO_LOGIN: {
        code: 'NO_LOGIN',
        status: 401,
    },
    ARGS_ERROR: {
        code: 'ARGS_ERROR',
    },
    CAN_NOT_BE_EMPTY: {
        code: 'CAN_NOT_BE_EMPTY',
    },
    NO_PERMISSIONS: {
        code: 'NO_PERMISSIONS',
        status: 403,
    },
    ENUM_CHANGED_INVALID: {
        code: 'ENUM_CHANGED_INVALID',
    },
    //数据库
    DB_NO_DATA: {
        code: 'DB_NO_DATA',
    },
    DB_ERROR: {
        code: 'DB_ERROR',
    },
    DB_DATA_ERROR: {
        code: 'DB_DATA_ERROR',
    },
    //缓存
    CACHE_TIMEOUT: {
        code: 'CACHE_TIMEOUT',
    },
    CACHE_EXPIRE: {
        code: 'CACHE_EXPIRE',
    },
    CAPTCHA_EXPIRE: {
        code: 'CACHE_EXPIRE',
    },

    USER_NOT_FOUND: {
        code: 'USER_NOT_FOUND',
    },
    NO_MATCH_DATA: {
        code: 'NO_MATCH_DATA',
    }
};
export default errorConfig;