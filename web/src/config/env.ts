export const currEnvCfg = {
  title: process.env.VUE_APP_TITLE,
  // host: `http://127.0.0.1:8080`,
  apiHost: process.env.VUE_APP_API
}
const config = {
  title: currEnvCfg.title,
  // ipHost: currEnvCfg.host,
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
