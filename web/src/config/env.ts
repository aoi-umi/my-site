
const host = 'sellfishboy.top'
const ip = '144.202.99.178'
const env = 'prod'
// const env = [host, ip].find(ele => location.hostname.includes(ele)) ? 'prod' : 'dev'
const envConfig: {
    [env: string]: {
        title: string;
        host: string;
        apiHost: string;
    }
} = {
  prod: {
    title: '正式',
    host: 'http://' + ip,
    apiHost: `//api.${host}`
  },
  dev: {
    title: '开发',
    host: 'http://192.168.100.119:8080',
    apiHost: `//${location.hostname}:8000`
  }
}
export const currEnvCfg = envConfig[env]
const config = {
  title: currEnvCfg.title,
  ipHost: currEnvCfg.host,
  socket: {
    test: {
      host: `${currEnvCfg.apiHost}`,
      path: '/devMgt/socket.io'
    }
  },
  wxOffiaCcount: {
    appId: 'wx4f6293a9fba42e66'
  }
}
export default config
