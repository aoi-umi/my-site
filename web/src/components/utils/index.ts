import Vue from 'vue'
import copy from 'copy-to-clipboard'
import AsyncValidator, { ValidateOption } from 'async-validator'
import SparkMD5 from 'spark-md5'
import * as qs from 'qs';
import { RawLocation, Location } from 'vue-router';

import { UtilsTsx } from './tsx'

export * from './utils'

const vm = Vue.prototype
export type Md5FileResult = {
  hash: string,
  chunkSize: number,
  chunks: FileChunkResult[]
};

type FileChunkResult = {
  data: ArrayBuffer,
  index: number,
  start: number
  end: number
}

const _Utils = {
  async promise<T>(fn: (resolve, reject) => void) {
    return new Promise<T>(async (res, rej) => {
      try {
        fn(res, rej);
      } catch (e) {
        rej(e)
      }
    })
  },
  base64ToFile(dataUrl: string, filename: string) {
    const arr = dataUrl.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new File([u8arr], filename, { type: mime })
  },

  getStyleName(stylePrefix: string, ...args: string[]) {
    return args.filter(ele => !!ele).map(ele => stylePrefix + ele)
  },

  dateParse(date) {
    if (typeof date == 'string') { date = date.replace(/-/g, '/') }
    if (!isNaN(date) && !isNaN(parseInt(date))) { date = parseInt(date) }
    if (!(date instanceof Date)) { date = new Date(date) }
    return date
  },

  getDateDiff(date1, date2) {
    date1 = this.dateParse(date1)
    date2 = this.dateParse(date2)

    let isMinus = false
    // date1 开始日期 ，date2 结束日期
    let timestamp = date2.getTime() - date1.getTime() // 时间差的毫秒数
    if (timestamp < 0) {
      timestamp = -timestamp
      isMinus = true
    }
    timestamp /= 1000
    const seconds = Math.floor(timestamp % 60)
    timestamp /= 60
    const minutes = Math.floor(timestamp % 60)
    timestamp /= 60
    const hours = Math.floor(timestamp % 24)
    timestamp /= 24
    const days = Math.floor(timestamp)
    let diff = (days ? days + ' ' : '') + ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2)
    if (isMinus) { diff = '-' + diff }
    return diff
  },

  copy2Clipboard(txt) {
    copy(txt)
  },

  isScrollEnd(elm?: HTMLElement | Window) {
    let scrollTop, clientHeight, scrollHeight
    if (!elm || elm instanceof Window || [document.body].includes(elm)) {
      scrollTop = document.documentElement.scrollTop || document.body.scrollTop
      clientHeight = document.documentElement.clientHeight || document.body.clientHeight
      scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight
    } else {
      scrollTop = elm.scrollTop
      clientHeight = elm.clientHeight
      scrollHeight = elm.scrollHeight
    }
    // console.log('--------------');
    // console.log([document.documentElement.scrollTop, document.documentElement.clientHeight, document.documentElement.scrollHeight].join(','));
    // console.log([document.body.scrollTop, document.body.clientHeight, document.body.scrollHeight].join(','));
    // console.log([scrollTop, clientHeight, scrollHeight].join(','));
    return (scrollTop + clientHeight >= scrollHeight)
  },

  isWxClient() {
    return /MicroMessenger/i.test(navigator.userAgent)
  },

  // 转换为中划线
  stringToHyphen(str) {
    str = str.replace(/^[A-Z]+/, function () {
      return arguments[0].toLowerCase()
    })
    str = str.replace(/_/g, '-')
    str = str.replace(/[A-Z]/g, function () {
      return '-' + arguments[0].toLowerCase()
    })
    str = str.toLowerCase()
    return str
  },

  getObjByDynCfg(cfgs) {
    let obj: any = {}
    cfgs?.forEach(ele => {
      obj[ele.name] = null
    })
    return obj
  },

  getValidRulesByDynCfg(cfgs, moduleText?) {
    let obj = {}
    cfgs?.forEach(ele => {
      if (ele.required) {
        obj[ele.name] = {
          required: true,
          message: `${moduleText ? `[${moduleText}]` : ''}请填写[${ele.text}]`
        }
      }
    })
    return obj
  },

  valid(data, rules, opt?: ValidateOption & { showMsg?: boolean }) {
    opt = {
      firstFields: true,
      first: true,
      showMsg: true,
      ...opt
    }
    let { showMsg, ...validOpt } = opt
    const validator = new AsyncValidator(rules)
    const result = {
      success: false,
      msg: '',
      invalidFields: null
    }
    return new Promise<typeof result>((resolve) => {
      validator.validate(data, validOpt, (errors, invalidFields) => {
        result.success = !errors
        result.msg = errors ? errors[0].message : ''
        result.invalidFields = invalidFields
      })
      if (showMsg && !result.success) {
        vm.$Message.warning(result.msg)
      }
      resolve(result)
    })
  },

  wait(ms?) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, ms || 0)
    })
  },

  group<T, U extends { name: string }>(list: T[], groupFn: (v: T) => U) {
    let obj: MyGroupType<T, U>[] = []
    for (let v of list) {
      let g = groupFn(v)
      if (!g) continue
      let o = obj.find(ele => ele.group.name === g.name)
      if (!o) {
        o = {
          group: g,
          child: []
        }
        obj.push(o)
      }
      o.child.push(v)
    }
    return obj
  },

  // 防抖
  debounce(fn: Function, delay = 500) {
    let timer = null
    return function () {
      if (timer) {
        clearTimeout(timer)
        timer = setTimeout(fn, delay)
      } else {
        timer = setTimeout(fn, delay)
      }
    }
  },

  round(x: number, n?: number) {
    let y = !n ? 1 : 10 ** n;
    return Math.round(x * y) / y;
  },

  md5(data: string | any) {
    if (typeof data === 'string')
      return SparkMD5.hash(data)
    else
      return SparkMD5.hashBinary(data)
  },

  async readFile(file: File, opt?: {
    chunkSize?: number;
    ranges?: { start?: number, end?: number }[]
  }) {
    return _Utils.promise<FileChunkResult[]>((resolve, reject) => {
      opt = { ...opt }
      let blobSlice = File.prototype.slice || File.prototype['mozSlice'] || File.prototype['webkitSlice'];

      let fileReader = new FileReader();
      let currRange = 0;
      let ranges = opt.ranges;
      if (ranges) {

      } else if (opt.chunkSize) {
        ranges = [];
        let chunkSize = opt.chunkSize;
        let chunks = Math.ceil(file.size / chunkSize);
        let currentChunk = 0;
        while (currentChunk < chunks) {
          let start = currentChunk * chunkSize;
          let end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;
          ranges.push({
            start,
            end,
          })
          currentChunk++;
        }
      }

      let buffs: FileChunkResult[] = [];
      let range
      fileReader.onload = function (e) {
        let buff = e.target.result as any
        buffs.push({
          data: buff,
          start: range?.start,
          end: range?.end,
          index: currRange
        });
        currRange++;
        if (!ranges || currRange >= ranges.length) {
          resolve(buffs);
        } else {
          loadNext();
        }
      }

      fileReader.onerror = function (e) {
        reject(e);
      };
      function loadNext() {
        let start, end;
        range = ranges?.[currRange]
        if (range) {
          start = range.start
          end = range.end
        }
        fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
      }

      loadNext();
    })
  },

  async md5File(file: File, chunkSize?: number) {
    // Read in chunks of 2MB
    chunkSize = chunkSize ?? 1024 * 1024 * 2;
    let spark = new SparkMD5.ArrayBuffer();

    let fileChunks = await _Utils.readFile(file, { chunkSize })

    let result: Md5FileResult = {
      hash: '',
      chunkSize,
      chunks: []
    }

    for (let chunk of fileChunks) {
      result.chunks.push({
        ...chunk,
      })
      spark.append(chunk.data);
    }

    let hash = spark.end()
    result.hash = hash;
    console.info('computed hash', hash);
    return result
  },

  getUrl(obj: Location) {
    let queryStr = qs.stringify(obj.query)
    let url = obj.path + (queryStr ? `?${queryStr}` : queryStr)
    return url
  },

  openWindow(location: RawLocation, target?: string) {
    let url = typeof location === 'string' ? location : Utils.getUrl(location);
    window.open(url)
  }
}

export const Utils = { ..._Utils, ...UtilsTsx }

type GroupDefaultType = { name: string, text?: string }
export type MyGroupType<T, U extends GroupDefaultType = GroupDefaultType> = {
  group: U,
  child: T[]
}
