import { Watch } from 'vue-property-decorator'
import { Base } from './base'

import { Component, Vue } from '@/components/decorator'

import './oauth.less';
import { OperateModel } from '@/helpers';
import { testApi, testSocket } from '@/api';
import { Spin } from 'view-design';
import { SignIn, SignUp } from './user/user-sign';

@Component
export default class WxAuth extends Base {
  stylePrefix = 'oauth-';

  private oauthOp: OperateModel = null
  private err = null
  private authName = ''
  private oauthName = ''
  private oauthData: any = {};
  created() {
    this.oauthName = this.$route.params.name
    this.oauthOp = this.getOpModel({
      prefix: '认证',
      noDefaultHandler: true,
      fn: async () => {
        let data = { code: this.$route.query.code };
        let rs = await testApi.userOauthLogin(data, { params: { name: this.oauthName } });
        this.oauthData = {
          ...rs
        };
        this.setLoginUser(this.oauthData.userInfo);
        
        return rs;
      }
    })
  }

  mounted() {
    this.auth();
  }

  async auth() {
    this.authName = this.$enum.oauthName.getName(this.oauthName);
    switch (this.$route.params.name) {
      case this.$enum.oauthName.github:
        if (this.$route.query.error) {
          this.err = this.$route.query.error
        } else {
          let rs = await this.oauthOp.run();
          if (!rs.success) {
            this.err = rs.msg;
          }
        }
        break;
      default:
        this.authName = 'unknow oauth'
        break;
    }
  }

  render() {
    return (
      <div class={this.getStyleName('root')}>
        <h2>{this.authName}</h2>
        <div class={this.getStyleName('info')}>
          {this.oauthOp.loading ?
            <div>
              <div>认证中</div>
              <div style="position: relative;margin-top: 30px;">
                <Spin size="large" fix></Spin>
              </div>
            </div> :
            (this.err ?
              <div>{this.err}</div> :
              <div>
                {this.oauthData.userInfo ?
                  <div>成功</div> :
                  <div>
                    该账号未绑定
                    <SignUp noTitle account={this.oauthData.nickname} oauthToken={this.oauthData.signUpToken} />
                  </div>
                }
              </div>
            )}
        </div>
      </div>)
  }
}