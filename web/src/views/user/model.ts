import { LocalStore } from '@/store'
import { dev } from '@/config'

export class LocalStoreUser {
    account: string;
    password?: string;
    static getList () {
      return LocalStore.getItem(dev.cacheKey.signInUsers) || [] as LocalStoreUser[]
    }

    static updateAccount (detail: LocalStoreUser, list?: LocalStoreUser[]) {
      if (!list) { list = this.getList() }
      const matchIdx = list.findIndex(ele => ele.account === detail.account)
      if (matchIdx >= 0) {
        list.splice(matchIdx, 1)
      }
      list.unshift(detail)
      LocalStore.setItem(dev.cacheKey.signInUsers, list)
    }

    static delAccount (account, list?: LocalStoreUser[]) {
      if (!list) { list = this.getList() }
      const matchIdx = list.findIndex(ele => ele.account === account)
      if (matchIdx >= 0) {
        list.splice(matchIdx, 1)
        LocalStore.setItem(dev.cacheKey.signInUsers, list)
      }
    }
}
