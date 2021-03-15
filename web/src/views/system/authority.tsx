import { Component, Vue, Watch } from 'vue-property-decorator'
import * as iview from 'iview'

import { Prop } from '@/components/property-decorator'
import { testApi } from '@/api'
import { myEnum, authority } from '@/config'
import { convert } from '@/helpers'
import { convClass, getCompOpts } from '@/components/utils'
import { Modal, Input, Form, FormItem, Button, Checkbox, Switch, Transfer } from '@/components/iview'
import { MyList, IMyList, Const as MyListConst } from '@/components/my-list'
import { MyTransfer, IMyTransfer } from '@/components/my-transfer'
import { MyConfirm } from '@/components/my-confirm'
import { MyTag, TagType } from '@/components/my-tag'
import { Base } from '../base'

type DetailDataType = {
    _id?: string;
    name?: string;
    code?: string;
    status?: number;
    statusText?: string;
    isDel?: boolean;
};

class AuthorityDetailProp {
    @Prop()
    detail: any;
}
@Component({
  extends: Base,
  mixins: [getCompOpts(AuthorityDetailProp)]
})
class AuthorityDetail extends Vue<AuthorityDetailProp & Base> {
    @Watch('detail')
  updateDetail (newVal) {
    const data = newVal || this.getDetailData()
    this.initDetail(data)
  }
    private innerDetail: DetailDataType = {};
    private getDetailData () {
      return {
        _id: '',
        name: '',
        code: '',
        status: myEnum.authorityStatus.启用
      }
    }

    private initDetail (data) {
      this.innerDetail = data
    }

    private rules = {
      name: [
        { required: true, trigger: 'blur' }
      ],
      code: [
        { required: true, trigger: 'blur' }
      ]
    };
    $refs: { formVaild: iview.Form };

    saving = false;
    async handleSave () {
      await this.operateHandler('保存', async () => {
        this.saving = true
        const detail = this.innerDetail
        const rs = await testApi.authoritySave({
          _id: detail._id,
          name: detail.name,
          code: detail.code,
          status: detail.status
        })
        this.$emit('save-success', rs)
        this.initDetail(this.getDetailData())
      }, {
        validate: this.$refs.formVaild.validate
      }
      ).finally(() => {
        this.saving = false
      })
    }

    render () {
      const detail = this.innerDetail
      return (
        <div>
          <h3>{detail._id ? '修改' : '新增'}</h3>
          <br />
          <Form label-width={50} ref='formVaild' props={{ model: detail }} rules={this.rules}>
            <FormItem label='状态' prop='status'>
              <Switch v-model={detail.status} true-value={myEnum.authorityStatus.启用} false-value={myEnum.authorityStatus.禁用} />
            </FormItem>
            <FormItem label='名字' prop='name'>
              <Input v-model={detail.name} />
            </FormItem>
            <FormItem label='编码' prop='code'>
              <Input v-model={detail.code} />
            </FormItem>
            <FormItem>
              <Button type='primary' on-click={() => {
                this.handleSave()
              }} loading={this.saving}>保存</Button>
            </FormItem>
          </Form>
        </div >
      )
    }
}

const AuthorityDetailView = convClass<AuthorityDetailProp>(AuthorityDetail)

@Component
export default class Authority extends Base {
    detailShow = false;
    delShow = false;
    detail: any;
    $refs: { list: IMyList<any> };

    protected created () {
      this.statusList = convert.ViewModel.enumToTagArray(myEnum.authorityStatus)
    }

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
      list.setQueryByKey(query, ['name', 'code', 'anyKey'])
      const status = this.$route.query.status as string
      const statusList = status ? status.split(',') : []
      this.statusList.forEach(ele => {
        ele.checked = statusList.includes(ele.key.toString())
      })
      convert.Test.queryToListModel(query, list.model)
      this.$refs.list.query(query)
    }

    delIds = [];
    statusList: TagType[] = [];
    async delClick () {
      await this.operateHandler('删除', async () => {
        await testApi.authorityDel(this.delIds)
        this.delIds = []
        this.delShow = false
        this.$refs.list.query()
      })
    }
    private async updateStatus (detail: DetailDataType) {
      await this.operateHandler('修改', async () => {
        const toStatus = detail.status == myEnum.authorityStatus.启用 ? myEnum.authorityStatus.禁用 : myEnum.authorityStatus.启用
        await testApi.authorityUpdate({ _id: detail._id, status: toStatus })
        detail.status = toStatus
        detail.statusText = myEnum.authorityStatus.getKey(toStatus)
      })
    }

    private get multiOperateBtnList () {
      const list = []
      if (this.storeUser.user.hasAuth(authority.authorityDel)) {
        list.push({
          text: '批量删除',
          onClick: (selection) => {
            this.delIds = selection.map(ele => ele._id)
            this.delShow = true
          }
        })
      }
      return list
    }

    private getColumns () {
      const columns = [{
        key: '_selection',
        type: 'selection',
        width: 60,
        align: 'center',
        hide: !this.multiOperateBtnList.length
      }, {
        title: '名字',
        key: 'name',
        sortable: 'custom' as any,
        minWidth: 120
      }, {
        title: '编码',
        key: 'code',
        sortable: 'custom' as any,
        minWidth: 120
      }, {
        title: '状态',
        key: 'statusText',
        minWidth: 80
      }, {
        title: '操作',
        key: 'action',
        fixed: 'right',
        width: 150,
        hide: !this.storeUser.user.existsAuth([authority.authoritySave, authority.authorityDel]),
        render: (h, params) => {
          const detail = params.row
          return (
            <div class={MyListConst.clsActBox}>
              {this.storeUser.user.hasAuth(authority.authoritySave) && [
                <a on-click={() => {
                  this.updateStatus(detail)
                }}>{detail.status == myEnum.authorityStatus.启用 ? '禁用' : '启用'}</a>,
                <a on-click={() => {
                  this.detail = detail
                  this.detailShow = true
                }}>编辑</a>
              ]}
              {this.storeUser.user.hasAuth(authority.authorityDel) &&
                            <a on-click={() => {
                              this.delIds = [detail._id]
                              this.delShow = true
                            }}>删除</a>
              }
            </div>
          )
        }
      }]
      return columns
    }

    protected render () {
      return (
        <div>
          <Modal v-model={this.detailShow} footer-hide mask-closable={false}>
            <AuthorityDetailView detail={this.detail} on-save-success={() => {
              this.detailShow = false
              this.$refs.list.query()
            }} />
          </Modal>
          <Modal v-model={this.delShow} footer-hide>
            <MyConfirm title='确认删除?' loading={true}
              cancel={() => {
                this.delShow = false
              }}
              ok={async () => {
                await this.delClick()
              }}>
                        将要删除{this.delIds.length}项
            </MyConfirm>
          </Modal>
          <MyList
            ref='list'
            queryArgs={{
              name: {
                label: '名字'
              },
              code: {
                label: '编码'
              },
              anyKey: {
                label: '任意字'
              }
            }}
            customQueryNode={<MyTag v-model={this.statusList} />}

            hideQueryBtn={{
              add: !this.storeUser.user.hasAuth(authority.authoritySave)
            }}

            columns={this.getColumns()}

            queryFn={async (data) => {
              const rs = await testApi.authorityQuery(data)
              return rs
            }}

            on-query={(model) => {
              this.$router.push({
                path: this.$route.path,
                query: {
                  ...model.query,
                  status: this.statusList.filter(ele => ele.checked).map(ele => ele.key).join(','),
                  ...convert.Test.listModelToQuery(model)
                }
              })
            }}

            on-add-click={() => {
              this.detail = null
              this.detailShow = true
            }}

            on-reset-click={() => {
              this.statusList.forEach(ele => {
                ele.checked = false
              })
            }}

            multiOperateBtnList={this.multiOperateBtnList}
          >
          </MyList>
        </div>
      )
    }
}

class AuthorityTransferProp {
    @Prop()
    selectedData: DetailDataType[];
}
@Component({
  mixins: [getCompOpts(AuthorityTransferProp)]
})
class AuthorityTransfer extends Vue<AuthorityTransferProp> {
    @Watch('selectedData')
  private updateSelectedData (newVal: DetailDataType[]) {
    this.insideSelectedData = newVal ? newVal.map(ele => this.dataConverter(ele)) : []
  }

    $refs: { transfer: IMyTransfer };
    private insideSelectedData = [];

    getChangeData (key?: string) {
      return this.$refs.transfer.getChangeData(key)
    }

    protected mounted () {
      this.$refs.transfer.loadData()
    }

    private dataConverter (ele: DetailDataType) {
      return {
        key: ele.code,
        label: ele.isDel ? `${ele.code}[已删除]` : `${ele.name}(${ele.code})`,
        data: ele
      }
    }
    private async loadData () {
      const rs = await testApi.authorityQuery({ status: myEnum.authorityStatus.启用, getAll: true })
      return rs.rows.map(ele => {
        return this.dataConverter(ele)
      })
    }
    protected render () {
      return (
        <MyTransfer
          ref='transfer'
          getDataFn={this.loadData}
          selectedData={this.insideSelectedData}
        >
        </MyTransfer>
      )
    }
}

export interface IAuthorityTransfer extends AuthorityTransfer { }
export const AuthorityTransferView = convClass<AuthorityTransferProp>(AuthorityTransfer)
