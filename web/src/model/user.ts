import * as helpers from '@/helpers'

export type LoginUserType = UserInfo & LoginUser;
export class LoginUser {
    isLogin = false;
    static create (data: UserInfo) {
      const user = new LoginUser()
      if (data) {
        for (const key in data) {
          user[key] = data[key]
        }
        user.isLogin = true
      } else {

      }
      return user as LoginUserType
    }

    hasAuth (this: LoginUserType, auth: string | string[]) {
      if (auth) {
        const authList = auth instanceof Array ? auth : [auth]
        for (const ele of authList) {
          if (!this.authority || !this.authority[ele]) { return false }
        }
      }
      return true
    }

    existsAuth (this: LoginUserType, auth: string | string[]) {
      const authList = auth instanceof Array ? auth : [auth]
      for (const ele of authList) {
        if (this.authority && this.authority[ele]) { return true }
      }
      return false
    }

    equalsId (this: LoginUserType, id: string) {
      return this._id && this._id === id
    }

    static createToken (account, pwd, data) {
      let token = account + helpers.md5(pwd) + JSON.stringify(data)
      token = helpers.md5(token)
      return token
    }

    static createReqWithToken (account, pwd, data) {
      data = {
        ...data,
        rand: helpers.randStr()
      }
      const token = LoginUser.createToken(account, pwd, data)
      data.token = token
      return data
    }
}
