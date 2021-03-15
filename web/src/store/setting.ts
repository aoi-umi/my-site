
import {
  Module,
  VuexModule,
  Mutation
} from 'vuex-module-decorators'

type SettingType = {
    signInShow: boolean;
};

@Module({ name: 'setting' })
export default class SettingStore extends VuexModule {
    setting: SettingType = { signInShow: false };

    @Mutation
    setSetting (setting: Partial<SettingType>) {
      this.setting = {
        ...this.setting,
        ...setting
      }
    }
}
