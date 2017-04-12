export const ENV = process.env.ENV || 'development';
export const WS_HOST = process.env.WS_HOST;
export const WS_PORT = process.env.WS_PORT;
export const WS_LOGIN = process.env.WS_LOGIN || process.env.WS_EMAIL;
export const WS_PASSWORD = process.env.WS_PASSWORD;

export const ROUTE_WS_AUTH = '/api/ddf/cli/authenticate';
export const ROUTE_WS_IMPORT = '/api/ddf/cli/import-dataset';

const passwordRegex = {
    production: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/,
    development: /^(?=.*[a-z0-9]){3,}/
};

export const PASSWORD_REGEX = passwordRegex[ENV];

const config = {
    ENV,

    ROUTE_WS_AUTH,
    ROUTE_WS_IMPORT,

    PASSWORD_REGEX,

    WS_HOST,
    WS_PORT,
    WS_LOGIN,
    WS_PASSWORD
};

export default config;