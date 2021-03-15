
import {
  Module,
  VuexModule,
  Mutation,
  Action,
  MutationAction,
  getModule
} from 'vuex-module-decorators'
import { LoginUserType, LoginUser } from '@/model/user'
import { dev } from '@/config'

@Module({ name: 'user' })
export default class LoginUserStore extends VuexModule {
    user: LoginUserType = LoginUser.create(null);

    @Mutation
    setUser (user) {
      this.user = LoginUser.create(user)
      if (!user) { localStorage.removeItem(dev.cacheKey.testUser) }
    }
}
