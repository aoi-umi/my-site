import { Component, Vue, Watch } from 'vue-property-decorator'
import * as iview from 'iview'

import { Prop } from '@/components/property-decorator'
import { testApi } from '@/api'
import { myEnum, authority, dev } from '@/config'
import { convert } from '@/helpers'
import { convClass, getCompOpts } from '@/components/utils'
import { Modal, Form, FormItem, Button, RadioGroup, Radio, Input, DatePicker } from '@/components/iview'
import { MyList, IMyList, Const as MyListConst } from '@/components/my-list'

import { AuthorityTransferView, IAuthorityTransfer } from '../system/authority'
import { IRoleTransfer, RoleTransferView } from '../system/role'
import { Base } from '../base'
import { AuthorityTagView } from '../comps/authority-tag'
import { RoleTagView } from '../comps/role-tag'
import { UserAvatarView } from '../comps/user-avatar'

export type DetailDataType = {
    _id?: string;
    account?: string;
    nickname?: string;
    avatar?: string;
    avatarUrl?: string;
    roleList?: { code: string; name: string; isDel: boolean; }[];
    authorityList?: { code: string; name: string; isDel: boolean, status: number }[];
    auth?: { [code: string]: any };
    createdAt?: string;
    status?: number;
    statusText?: string;
    profile?: string;
    disabledTo?: Date;
    follower?: number;
    following?: number;
    article?: number;
    video?: number;
    bind?: { wx: boolean };

    self?: boolean;
};

class UserMgtDetailProp {
    @Prop({
      default: myEnum.userEditType.修改
    })
    type: string;

    @Prop()
    detail: any;
}
@Component({
  extends: Base,
  mixins: [getCompOpts(UserMgtDetailProp)]
})
class UserMgtDetail extends Vue<UserMgtDetailProp & Base> {
    @Watch('detail')
  updateDetail (newVal) {
    const data = newVal
    this.initDetail(data)
  }
    private innerDetail: DetailDataType = {};

    private initDetail (data) {
      if (data.disabledTo) { data.disabledTo = new Date(data.disabledTo) }
      this.innerDetail = data
      this.disableType = data.disabled ? myEnum.userDisableType.封禁至 : myEnum.userDisableType.解封
      this.password = ''
    }

    private rules = {};
    $refs: { formVaild: iview.Form; roleTransfer: IRoleTransfer, authTransfer: IAuthorityTransfer };
    private disableType = myEnum.userDisableType.解封;
    private password = '';

    private saving = false;
    private async save () {
      await this.operateHandler('保存', async () => {
        this.saving = true
        const detail = this.innerDetail
        let rs
        if (this.type == myEnum.userEditType.修改) {
          const { addList: addAuthList, delList: delAuthList } = this.$refs.authTransfer.getChangeData('key')
          const { addList: addRoleList, delList: delRoleList } = this.$refs.roleTransfer.getChangeData('key')
          rs = await testApi.userMgtSave({
            _id: detail._id,
            addAuthList,
            delAuthList,
            addRoleList,
            delRoleList,
            password: this.password
          })
        } else {
          rs = await testApi.userMgtDisable({
            _id: detail._id,
            disabled: this.disableType == myEnum.userDisableType.封禁至,
            disabledTo: detail.disabledTo
          })
        }
        this.$emit('save-success', rs)
      }).finally(() => {
        this.saving = false
      })
    }

    protected render () {
      const detail = this.innerDetail
      return (
        <div>
          <h3>{myEnum.userEditType.getKey(this.type)}</h3>
          <br />
          <Form label-width={60} ref='formVaild' props={{ model: detail }} rules={this.rules} nativeOn-submit={(e) => {
            e.preventDefault()
          }}>
            <FormItem label='账号'>{detail.account}({detail.nickname})</FormItem>
            {this.type == myEnum.userEditType.修改
              ? <div>
                <FormItem label='重置密码'>
                  <Input v-model={this.password} />
                </FormItem>
                <FormItem label='角色'>
                  <RoleTransferView ref='roleTransfer' selectedData={detail.roleList} />
                </FormItem>
                <FormItem label='权限'>
                  <AuthorityTransferView ref='authTransfer' selectedData={detail.authorityList} />
                </FormItem>
              </div>
              : <div>
                <FormItem label='封禁'>
                  <RadioGroup v-model={this.disableType}>
                    {myEnum.userDisableType.toArray().map(s => {
                      return <Radio label={s.value}>{s.key}</Radio>
                    })}
                  </RadioGroup>
                </FormItem>
                <FormItem v-show={this.disableType == myEnum.userDisableType.封禁至}>
                  <DatePicker v-model={detail.disabledTo} placeholder='永久' options={{
                    disabledDate: (date?) => {
                      return date && date.valueOf() < Date.now()
                    }
                  }} />
                </FormItem>
              </div>
            }
            <FormItem>
              <Button type='primary' on-click={() => {
                this.save()
              }} loading={this.saving}>保存</Button>
            </FormItem>
          </Form>
        </div >
      )
    }
}

const UserMgtDetailView = convClass<UserMgtDetailProp>(UserMgtDetail)

@Component
export default class UserMgt extends Base {
    detailShow = false;
    delShow = false;
    detail: any;
    $refs: { list: IMyList<any> };

    editType;
    mounted () {
      this.query()
    }

    @Watch('$route')
    route (to, from) {
      this.query()
    }

    query () {
      const list = this.$refs.list
      const query = this.$route.query
      list.setQueryByKey(query, ['account', 'nickname', 'role', 'authority', 'anyKey'])
      convert.Test.queryToListModel(query, list.model)
      this.$refs.list.query(query)
    }

    private getColumns () {
      const columns = [{
        key: '_expand',
        type: 'expand',
        width: 30,
        render: (h, params) => {
          const auth = params.row.auth
          const enableAuthList: any[] = Object.values(auth)
          return <AuthorityTagView value={enableAuthList} />
        }
      }, {
        title: '账号',
        key: 'account',
        render: (h, params) => {
          return <UserAvatarView style={{ margin: '5px' }} user={params.row} />
        }
      }, {
        title: '角色',
        key: 'roleList',
        render: (h, params) => {
          const roleList = params.row.roleList
          return <RoleTagView value={roleList} />
        }
      }, {
        title: '权限',
        key: 'authorityList',
        render: (h, params) => {
          return <AuthorityTagView value={params.row.authorityList} />
        }
      }, {
        title: '创建时间',
        key: 'createdAt',
        sortable: 'custom' as any,
        render: (h, params) => {
          return <label>{this.$utils.dateFormat(params.row.createdAt)}</label>
        }
      }, {
        title: '状态',
        key: 'statusText'
      }, {
        title: '操作',
        key: 'action',
        fixed: 'right',
        width: 100,
        hide: !this.storeUser.user.existsAuth([authority.userMgtEdit, authority.userMgtDisable]),
        render: (h, params) => {
          const detail = params.row
          return (
            <div class={MyListConst.clsActBox}>
              {this.storeUser.user.hasAuth(authority.userMgtEdit) && detail.canEdit &&
                            <a on-click={() => {
                              this.showDetail(myEnum.userEditType.修改, detail)
                            }}>编辑</a>
              }
              {this.storeUser.user.hasAuth(authority.userMgtDisable) && detail.canEdit &&
                            <a on-click={() => {
                              this.showDetail(myEnum.userEditType.封禁, detail)
                            }}>禁用</a>
              }
            </div >
          )
        }
      }]
      return columns
    }

    private showDetail (type, detail) {
      this.detail = detail
      this.editType = type
      this.detailShow = true
    }

    protected render () {
      return (
        <div>
          <Modal v-model={this.detailShow} footer-hide mask-closable={false}>
            <UserMgtDetailView type={this.editType} detail={this.detail} on-save-success={() => {
              this.detailShow = false
              this.$refs.list.query()
            }} />
          </Modal>
          <MyList
            ref='list'

            queryArgs={{
              account: {
                label: '账号'
              },
              nickname: {
                label: '昵称'
              },
              role: {
                label: '角色'
              },
              authority: {
                label: '权限'
              },
              anyKey: {
                label: '任意字'
              }
            }}
            hideQueryBtn={{ add: true }}

            defaultColumn={{
              minWidth: 120
            }}
            columns={this.getColumns()}

            queryFn={async (data) => {
              const rs = await testApi.userMgtQuery(data)

              rs.rows.forEach(ele => {
                if (!ele.auth || !Object.keys(ele.auth).length) { ele._disableExpand = true } else { ele._expanded = true }
              })

              return rs
            }}

            on-query={(model) => {
              this.$router.push({
                path: this.$route.path,
                query: {
                  ...model.query,
                  ...convert.Test.listModelToQuery(model)
                }
              })
            }}
          >
          </MyList>
        </div>
      )
    }
}
