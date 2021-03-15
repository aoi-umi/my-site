import axios, { AxiosRequestConfig } from 'axios'
import { AnimeInstance } from 'animejs'
import * as md from 'node-forge/lib/md.all'

export async function request (options: AxiosRequestConfig) {
  if (!options.url) { throw new Error('url can not empty!') }
  let opt: AxiosRequestConfig = {
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json; charset=UTF-8',
      'Access-Control-Allow-Origin': '*'
    },
    method: 'POST'
  }
  if (options.headers) {
    opt.headers = extend({}, opt.headers, options.headers)
    delete options.headers
  }
  opt = extend(opt, options)

  if (opt.method?.toLowerCase() == 'get') { opt.params = opt.data }

  const rs = await axios.request(opt)
  return rs
}

export function extend (...args) {
  const res = args[0] || {}
  for (let i = 1; i < args.length; i++) {
    const arg = args[i]
    if (typeof (arg) !== 'object') {
      continue
    }
    for (const key in arg) {
      if (arg[key] !== undefined) { res[key] = arg[key] }
    }
  }
  return res
}

export function clone<T> (obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

function getDeco (fn: (constructor) => any) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    return fn(constructor)
  }
}

export function error (e, code?) {
  if (!(e instanceof Error)) { e = new Error(e) }
  if (code) { e.code = code }
  return e
}

export function randStr () {
  return Math.random().toString(36).substr(2, 15)
}

export function md5 (str: string) {
  const md5 = md.md5.create()
  md5.update(str, 'utf8')
  return md5.digest().toHex()
}

export const stringFormat = function (formatString: string, ...args) {
  if (!formatString) { formatString = '' }
  let reg = /(\{(\d)\})/g
  if (typeof args[0] === 'object') {
    args = args[0]
    reg = /(\{([^{}]+)\})/g
  }
  const result = formatString.replace(reg, function () {
    const match = arguments[2]
    return args[match] || ''
  })
  return result
}

export const stopAnimation = (animations: AnimeInstance | AnimeInstance[]) => {
  const stop = (anim: AnimeInstance) => {
    if (anim) {
      const { duration, remaining } = anim
      if (remaining === 1) anim.seek(duration)
      else anim.pause()
    }
  }
  if (Array.isArray(animations)) animations.forEach(anim => stop(anim))
  else stop(animations)
}

export function defer<T = any> () {
  let resolve: (value?: T | PromiseLike<T>) => void,
    reject: (reason?: any) => void
  const promise = new Promise<T>((reso, reje) => {
    resolve = reso
    reject = reje
  })
  return {
    promise,
    resolve,
    reject
  }
}
