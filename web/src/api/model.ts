import { AxiosRequestConfig, AxiosResponse } from 'axios'

import { request, extend, clone } from '../helpers/utils'

export type ApiMethod<T, U extends ApiMethodConfigType = ApiMethodConfigType> = {
  [P in keyof T]: U
}
type BeforeRequest = (request: AxiosRequestConfig) => any;
type AfterResponse<T = any> = (data: T, response?: AxiosResponse<T>) => any;
export type RequestByConfigOption<T> = {
  userOptions?: { params: any };
  beforeRequest?: BeforeRequest;
  afterResponse?: AfterResponse<T>;
} & AxiosRequestConfig;

// 推断类型
export type ApiMethodInferType<Req, Res> = {}
export class ApiModel<T> {
  protected beforeRequest: BeforeRequest;
  protected afterResponse: AfterResponse;
  constructor(protected apiConfig: ApiConfigModel<ApiMethod<T>>, opt?: {
    beforeRequest?: BeforeRequest;
    afterResponse?: AfterResponse;
  }) {
    opt = extend({}, opt)
    if (opt.beforeRequest) { this.beforeRequest = opt.beforeRequest }
    if (opt.afterResponse) { this.afterResponse = opt.afterResponse }
  }

  static create<T, U extends ApiModel<T>>(api: U) {
    for (let key in api.apiConfig.method as any) {
      if (api[key]) continue
      let method = api.apiConfig.method[key]
      api[key] = (data, options) => {
        return api.requestByConfig(method, { data, userOptions: options })
      }
    }
    return api as (U & {
      [P in keyof T]: (data?: T[P] extends ApiMethodInferType<infer Req, any> ? Req : any,
        options?: {
          params?: any
        })
        => Promise<T[P] extends ApiMethodInferType<any, infer Res> ? Res : any>
    })
  }

  getRequestConfig(config: ApiMethodConfigType) {
    if (!config) { throw new Error('config is null') }
    const cfg = clone<ApiMethodConfigType>(config as any)
    let args = clone(this.apiConfig.defaultArgs)
    if (!cfg.isUseDefault && cfg.args) {
      args = extend(args, cfg.args)
    }
    return {
      args,
      cfg,
      method: cfg.method,
      url: args.host + cfg.url
    }
  }

  protected async requestByConfig<U = any>(config: ApiMethodConfigType, options?: RequestByConfigOption<U>) {
    const { url, method } = this.getRequestConfig(config)

    let req: RequestByConfigOption<U> = extend({
      url,
      method
    }, options)
    const beforeRequest = req.beforeRequest || this.beforeRequest
    const afterResponse = req.afterResponse || this.afterResponse

    if (beforeRequest) { req = await beforeRequest(req) }

    let userOptions = {
      ...req.userOptions
    }
    let required = [];
    let newUrl = req.url.replace(/\/:([^\/]+)/g, (...args) => {
      let v = (userOptions.params && userOptions.params[args[1]]) ?? '';
      if (v === '') required.push(args[1])
      return `/${v}`;
    })
    if (required.length)
      throw new Error(`params [ ${required.join(', ')} ] is required`)
    req.url = newUrl;

    const response = await request(req)
    let data = response.data
    if (afterResponse) { data = await afterResponse(data, response) }
    return data as U
  }
}

export type ApiDefaultArgsType = { host: string };
export type ApiMethodConfigType<T extends ApiDefaultArgsType = ApiDefaultArgsType> = {
  url: string,
  method?: string,
  isUseDefault?: boolean,
  args?: T
};
type ApiMethodType<MethodT, T extends ApiDefaultArgsType> = {
  [P in keyof MethodT]: ApiMethodConfigType<T>
}
export type ApiConfigModel<MethodT extends Object, T extends ApiDefaultArgsType = ApiDefaultArgsType> = {
  defaultArgs: T,
  method: ApiMethodType<MethodT, T>,
}

import * as socketio from 'socket.io-client'
export class Socket {
  socket: SocketIOClient.Socket;
  constructor(uri: string, opts?: SocketIOClient.ConnectOpts) {
    this.socket = socketio.connect(uri, opts)
  }
}
