import { Component, Vue, Watch } from 'vue-property-decorator'
import { getModule } from 'vuex-module-decorators'

import SettingStore from '@/store/setting'
import LoginUserStore from '@/store/login-user'
import { dev, error } from '@/config'
import { routerConfig } from '@/router'
import { MyBase } from '@/components/my-base'
import { OperateOption, OperateModel } from '@/helpers'

@Component
export class Base extends MyBase {
  get storeUser () {
    return getModule(LoginUserStore, this.$store)
  }

  get storeSetting () {
    return getModule(SettingStore, this.$store)
  }

  protected isSmall = false;
  protected created () {
    this.handleResize()
  }
  protected mounted () {
    window.addEventListener('resize', this.handleResize)
  }

  protected beforeDestroy () {
    window.removeEventListener('resize', this.handleResize)
  }

  private handleResize () {
    this.isSmall = document.body.clientWidth < 576
  }

  getOpModel (opt:OperateOption) {
    return new OperateModel({
      defaultErrHandler: (e) => {
        if (e.code == error.NO_LOGIN.code) {
          this.storeSetting.setSetting({
            signInShow: true
          })
        } else if (e.code == error.NOT_FOUND.code) {
          this.toError(error.NOT_FOUND)
        }
      },
      ...opt
    })
  }

  async operateHandler (operate: string, fn: () => any, opt?: {
    beforeValid?: () => any;
    onSuccessClose?: () => any;
    validate?: () => Promise<boolean>,
    noDefaultHandler?: boolean;
    noSuccessHandler?: boolean;
    noErrorHandler?: boolean;
  }) {
    const result = {
      success: true,
      msg: '',
      err: null
    }
    try {
      opt = { ...opt }
      opt.beforeValid && await opt.beforeValid()
      if (opt.validate) {
        let valid = await opt.validate()
        if (!valid) {
          result.success = false
          result.msg = '参数有误'
          this.$Message.error('参数有误')
          return result
        }
      }
      await fn()
      if (!opt.noDefaultHandler && !opt.noSuccessHandler) {
        this.$Message.success({
          content: operate + '成功',
          onClose: opt.onSuccessClose
        })
      }
      return result
    } catch (e) {
      result.success = false
      result.msg = e.message
      result.err = e
      if (!opt.noDefaultHandler && !opt.noErrorHandler) {
        if (e.code == error.NO_LOGIN.code) {
          this.storeSetting.setSetting({
            signInShow: true
          })
        } else if (e.code == error.NOT_FOUND.code) {
          this.toError(error.NOT_FOUND)
        } else {
          this.$Message.error(operate + '出错:' + e.message)
        }
      }
      if (!e.code) { console.error(e) }
      return result
    }
  }

  protected toError (query: { code?: string; msg?: string }) {
    this.$router.push({
      path: routerConfig.error.path,
      query
    })
  }

  protected setTitle (title: string) {
    document.title = title
  }
}
