import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop } from '@/components/decorator'
import { testApi } from '@/api'
import { myEnum, authority } from '@/config'
import { convert } from '@/helpers'
import {
  Modal,
  Input,
  Form,
  FormItem,
  Button,
  Switch,
} from '@/components/iview'
import { MyList, Const as MyListConst } from '@/components/my-list'
import { MyTransfer } from '@/components/my-transfer'
import { TagType, MyTag } from '@/components/my-tag'

import { AuthorityTag, AuthorityDetail } from '../comps/authority-tag'
import { Base } from '../base'
import { OperateButton, OperateDataType } from '../comps/operate-button'

import { AuthorityTransfer } from './authority'

export type DetailDataType = {
  _id?: string
  name?: string
  code?: string
  status?: number
  statusText?: string
  authorityList?: AuthorityDetail[]
  isDel?: boolean
}

class RoleDetailProp {
  @Prop()
  detail: any
}
@Component({
  extends: Base,
  props: RoleDetailProp,
})
class RoleDetail extends Vue<RoleDetailProp, Base> {
  @Watch('detail')
  updateDetail(newVal) {
    const data = newVal || this.getDetailData()
    this.initDetail(data)
  }
  private innerDetail: DetailDataType = {}
  private getDetailData() {
    return {
      _id: '',
      name: '',
      code: '',
      status: myEnum.roleStatus.启用,
      authorityList: [],
    }
  }

  private initDetail(data) {
    this.innerDetail = data
  }

  private rules = {
    name: [{ required: true }],
    code: [{ required: true }],
  }
  $refs: { formVaild: iView.Form; authTransfer: AuthorityTransfer }

  private saving = false
  private async handleSave() {
    await this.operateHandler(
      '保存',
      async () => {
        this.saving = true
        const detail = this.innerDetail
        const { addList, delList } =
          this.$refs.authTransfer.getChangeData('key')
        const rs = await testApi.roleSave({
          _id: detail._id,
          name: detail.name,
          code: detail.code,
          status: detail.status,
          addAuthList: addList,
          delAuthList: delList,
        })
        this.$emit('save-success', rs)
        this.initDetail(this.getDetailData())
      },
      {
        validate: this.$refs.formVaild.validate,
      },
    ).finally(() => {
      this.saving = false
    })
  }

  protected render() {
    const detail = this.innerDetail
    return (
      <div>
        <h3>{detail._id ? '修改' : '新增'}</h3>
        <br />
        <Form
          label-width={60}
          ref="formVaild"
          props={{ model: detail }}
          rules={this.rules}
        >
          <FormItem label="状态" prop="status">
            <Switch
              v-model={detail.status}
              true-value={myEnum.roleStatus.启用}
              false-value={myEnum.roleStatus.禁用}
            />
          </FormItem>
          <FormItem label="名字" prop="name">
            <Input v-model={detail.name} />
          </FormItem>
          <FormItem label="编码" prop="code">
            <Input v-model={detail.code} />
          </FormItem>
          <FormItem label="权限">
            <AuthorityTransfer
              ref="authTransfer"
              selectedData={detail.authorityList}
            />
          </FormItem>
          <FormItem>
            <Button
              type="primary"
              on-click={() => {
                this.handleSave()
              }}
              loading={this.saving}
            >
              保存
            </Button>
          </FormItem>
        </Form>
      </div>
    )
  }
}

@Component
export default class Role extends Base {
  detailShow = false
  detail: any
  $refs: { list: MyList<any> }

  protected created() {
    this.statusList = convert.ViewModel.enumToTagArray(myEnum.roleStatus)
  }

  mounted() {
    this.query()
  }

  @Watch('$route')
  route(to, from) {
    this.query()
  }

  query() {
    const list = this.$refs.list
    const query = this.$route.query
    list.setQueryByKey(query, ['name', 'code', 'anyKey'])
    const status = query.status as string
    const statusList = status ? status.split(',') : []
    this.statusList.forEach((ele) => {
      ele.checked = statusList.includes(ele.key.toString())
    })
    convert.Test.queryToListModel(query, list.model)
    this.$refs.list.query(query)
  }

  delIds = []
  statusList: TagType[] = []
  delConfirm() {
    this.$utils.confirm(`将要删除${this.delIds.length}项`, {
      ok: this.delClick,
    })
  }
  async delClick() {
    await this.operateHandler('删除', async () => {
      await testApi.roleDel({ idList: this.delIds })
      this.delIds = []
      this.$refs.list.refresh()
    })
  }
  private async updateStatus(detail: DetailDataType) {
    await this.operateHandler('修改', async () => {
      const toStatus =
        detail.status == myEnum.roleStatus.启用
          ? myEnum.roleStatus.禁用
          : myEnum.roleStatus.启用
      await testApi.roleUpdate({ _id: detail._id, status: toStatus })
      detail.status = toStatus
      detail.statusText = myEnum.roleStatus.getKey(toStatus)
    })
  }

  private get multiOperateBtnList() {
    const list = []
    if (this.storeUser.user.hasAuth(authority.roleDel)) {
      list.push({
        text: '批量删除',
        onClick: (selection) => {
          this.delIds = selection.map((ele) => ele._id)
          this.delConfirm()
        },
      })
    }
    return list
  }

  private getOp(detail) {
    let operate: OperateDataType[] = []
    operate = [
      ...operate,
      {
        text: '查看',
        fn: () => {},
      },
    ]
    if (detail.canEdit && this.storeUser.user.hasAuth(authority.roleSave)) {
      operate = [
        ...operate,
        {
          text: detail.status == myEnum.roleStatus.启用 ? '禁用' : '启用',
          fn: () => {
            this.updateStatus(detail)
          },
        },
        {
          text: '编辑',
          fn: () => {
            this.detail = detail
            this.detailShow = true
          },
        },
      ]
    }
    if (detail.canEdit && this.storeUser.user.hasAuth(authority.roleDel)) {
      operate.push({
        text: '删除',
        fn: () => {
          this.delIds = [detail._id]
          this.delConfirm()
        },
      })
    }
    return operate
  }

  private getColumns() {
    const columns = [
      {
        key: '_selection',
        type: 'selection',
        width: 60,
        align: 'center',
        hide: !this.multiOperateBtnList.length,
      },
      {
        key: '_expand',
        type: 'expand',
        width: 30,
        render: (h, params) => {
          const authorityList = params.row.authorityList
          return <AuthorityTag value={authorityList} />
        },
      },
      {
        title: '名字',
        key: 'name',
        sortable: 'custom' as any,
        minWidth: 120,
      },
      {
        title: '编码',
        key: 'code',
        sortable: 'custom' as any,
        minWidth: 120,
      },
      {
        title: '状态',
        key: 'statusText',
        minWidth: 80,
      },
      {
        title: '操作',
        key: 'action',
        fixed: 'right',
        width: 150,
        hide: !this.storeUser.user.existsAuth([
          authority.roleSave,
          authority.roleDel,
        ]),
        render: (h, params) => {
          const detail = params.row
          return (
            <div class={MyListConst.clsActBox}>
              {this.getOp(detail).map((ele) => (
                <OperateButton data={ele}></OperateButton>
              ))}
            </div>
          )
        },
      },
    ]
    return columns
  }

  protected render() {
    return (
      <div>
        <Modal v-model={this.detailShow} footer-hide mask-closable={false}>
          <RoleDetail
            detail={this.detail}
            on-save-success={() => {
              this.detailShow = false
              this.$refs.list.query()
            }}
          />
        </Modal>
        <MyList
          ref="list"
          queryArgs={{
            name: {
              label: '名字',
            },
            code: {
              label: '编码',
            },
            authority: {
              label: '权限',
            },
            anyKey: {
              label: '任意字',
            },
          }}
          customQueryNode={<MyTag v-model={this.statusList} />}
          hideQueryBtn={{
            add: !this.storeUser.user.hasAuth(authority.roleSave),
          }}
          columns={this.getColumns()}
          queryFn={async (data) => {
            const rs = await testApi.roleQuery(data)

            rs.rows.forEach((ele) => {
              if (!ele.authorityList || !ele.authorityList.length) {
                ele._disableExpand = true
              } else {
                ele._expanded = true
              }
            })

            return rs
          }}
          on-query={(model) => {
            this.goToPage({
              path: this.$route.path,
              query: {
                ...model.query,
                status: this.statusList
                  .filter((ele) => ele.checked)
                  .map((ele) => ele.key)
                  .join(','),
                ...convert.Test.listModelToQuery(model),
              },
            })
          }}
          on-add-click={() => {
            this.detail = null
            this.detailShow = true
          }}
          on-reset-click={() => {
            this.statusList.forEach((ele) => {
              ele.checked = false
            })
          }}
          multiOperateBtnList={this.multiOperateBtnList}
        ></MyList>
      </div>
    )
  }
}

class RoleTransferProp {
  @Prop()
  selectedData: DetailDataType[]
}
@Component({
  props: RoleTransferProp,
})
export class RoleTransfer extends Vue<RoleTransferProp> {
  @Watch('selectedData')
  private updateSelectedData(newVal: DetailDataType[]) {
    this.insideSelectedData = newVal
      ? newVal.map((ele) => this.dataConverter(ele))
      : []
  }

  $refs: { transfer: MyTransfer }
  private insideSelectedData = []

  getChangeData(key?: string) {
    return this.$refs.transfer.getChangeData(key)
  }

  protected mounted() {
    this.$refs.transfer.loadData()
  }

  private dataConverter(ele: DetailDataType) {
    return {
      key: ele.code,
      label: ele.isDel ? `${ele.code}[已删除]` : `${ele.name}(${ele.code})`,
      data: ele,
    }
  }
  private async loadData() {
    const rs = await testApi.roleQuery({
      status: myEnum.roleStatus.启用,
      getAll: true,
    })
    return rs.rows.map((ele) => {
      return this.dataConverter(ele)
    })
  }
  protected render() {
    return (
      <MyTransfer
        ref="transfer"
        getDataFn={this.loadData}
        selectedData={this.insideSelectedData}
      ></MyTransfer>
    )
  }
}
