import { Component, Vue, Watch } from 'vue-property-decorator'
import * as iview from 'iview'

import { Prop } from '@/components/property-decorator'
import { testApi } from '@/api'
import { myEnum, authority, dev } from '@/config'
import { routerConfig } from '@/router'
import { convert } from '@/helpers'
import { convClass, getCompOpts } from '@/components/utils'
import { Modal, Input, Form, FormItem, Button, Checkbox, RadioGroup, Radio, InputNumber, DatePicker, Row, Col } from '@/components/iview'
import { MyList, IMyList, Const as MyListConst } from '@/components/my-list'
import { TagType, MyTag } from '@/components/my-tag'
import { Base } from './base'
import { UserAvatarView } from './comps/user-avatar'
type DetailDataType = {
    _id?: string;
    type?: string;
    title?: string;
    content?: number;
    status?: number;
    statusText?: number;
    refundStatus?: number;
    refundStatusText?: number;
    money?: number;
};

class PayMgtDetailProp {
    @Prop()
    detail: any;
}
@Component({
  extends: Base,
  mixins: [getCompOpts(PayMgtDetailProp)]
})
class PayMgtDetail extends Vue<PayMgtDetailProp & Base> {
    @Watch('detail')
  updateDetail (newVal) {
    const data = newVal || this.getDetailData()
    this.initDetail(data)
  }
    private innerDetail: DetailDataType = {};
    private getDetailData () {
      return {
        _id: '',
        title: '',
        content: '',
        money: 1,
        type: myEnum.assetSourceType.支付宝
      }
    }

    private initDetail (data) {
      this.innerDetail = data
    }

    typeList: { key: string; value: any, checked?: boolean }[] = [];
    created () {
      this.typeList = myEnum.assetSourceType.toArray().filter(ele => ele.value === myEnum.assetSourceType.支付宝).map(ele => {
        ele['checked'] = false
        return ele
      })
    }

    private rules = {
      title: [
        { required: true, trigger: 'blur' }
      ],
      content: [
        { required: true, trigger: 'blur' }
      ]
    };
    $refs: { formVaild: iview.Form };

    saving = false;
    async handleSave () {
      await this.operateHandler('创建', async () => {
        this.saving = true
        const detail = this.innerDetail
        const rs = await testApi.payCreate({
          type: detail.type,
          title: detail.title,
          content: detail.content,
          money: detail.money
        })
        window.open(rs.url, '_blank')
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
          <h3>{detail._id ? '详情' : '新增'}</h3>
          <br />
          <Form label-width={80} ref='formVaild' props={{ model: detail }} rules={this.rules}>
            <FormItem label='标题' prop='title'>
              <Input v-model={detail.title} />
            </FormItem>
            <FormItem label='内容' prop='content'>
              <Input v-model={detail.content} />
            </FormItem>
            <FormItem label='价格' prop='money'>
              <InputNumber v-model={detail.money} min={0.01} precision={2} active-change={false} />
            </FormItem>
            <FormItem label='支付方式' prop='type'>
              <RadioGroup v-model={detail.type}>
                {this.typeList.map(ele => {
                  return <Radio label={ele.value}>{ele.key}</Radio>
                })}
              </RadioGroup>
            </FormItem>
            {!detail._id && <FormItem>
              <Button type='primary' on-click={() => {
                this.handleSave()
              }} loading={this.saving}>提交</Button>
            </FormItem>}
          </Form>
        </div >
      )
    }
}

const PayDetailView = convClass<PayMgtDetailProp>(PayMgtDetail)

@Component
export default class Pay extends Base {
    detailShow = false;
    delShow = false;
    detail: any;
    $refs: { list: IMyList<any> };

    protected created () {
      this.statusList = convert.ViewModel.enumToTagArray(myEnum.payStatus)
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
      const query: any = this.$route.query
      list.setQueryByKey({
        ...query,
        createdAt: [query.createdAtFrom ? new Date(query.createdAtFrom) : '', query.createdAtTo ? new Date(query.createdAtTo) : '']
      }, ['orderNo', 'outOrderNo', 'anyKey', 'createdAt'])
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

    private updateRow (detail, rs) {
      const data = this.$refs.list.result.data
      data.splice(data.findIndex(ele => ele._id === detail._id), 1, {
        ...detail,
        ...rs
      })
    }

    private getColumns () {
      let columns = []
      if (this.storeUser.user.hasAuth(authority.payMgtQuery)) {
        columns.push({
          title: '用户',
          key: 'user',
          minWidth: 160,
          render: (h, params) => {
            const detail = params.row
            return (
              <UserAvatarView user={detail.user} style={{ margin: '5px' }} />
            )
          }
        })
      }
      columns = [...columns, {
        title: '单号',
        key: 'orderNo',
        minWidth: 120,
        render: (h, params) => {
          const detail = params.row
          return (this.storeUser.user.hasAuth(authority.payMgtQuery) ? <a on-click={() => {
            this.$router.push({
              path: routerConfig.assetMgtLog.path,
              query: { orderNo: detail.orderNo }
            })
          }}>{detail.orderNo}</a> : <span>{detail.orderNo}</span>)
        }
      }, {
        title: '标题',
        key: 'title',
        minWidth: 120
      }, {
        title: '内容',
        key: 'content',
        minWidth: 120
      }, {
        title: '金额',
        key: 'money'
      }, {
        title: '支付类型',
        key: 'typeText'
      }, {
        title: '外部单号',
        key: 'outOrderNo',
        minWidth: 120,
        render: (h, params) => {
          const detail = params.row
          return (this.storeUser.user.hasAuth(authority.payMgtQuery) ? <a on-click={() => {
            this.$router.push({
              path: routerConfig.assetMgtLog.path,
              query: { outOrderNo: detail.outOrderNo }
            })
          }}>{detail.outOrderNo}</a> : <span>{detail.outOrderNo}</span>)
        }
      }, {
        title: '状态',
        key: 'statusText'
      }, {
        title: '退款状态',
        key: 'refundStatusText'
      }, {
        title: '创建时间',
        key: 'createdAt',
        render: (h, params) => {
          const detail = params.row
          return (
            <span>{this.$utils.dateFormat(detail.createdAt)}</span>
          )
        }
      }, {
        title: '操作',
        key: 'action',
        fixed: 'right',
        width: 150,
        render: (h, params) => {
          const detail = params.row
          return (
            <div class={MyListConst.clsActBox}>
              {detail.canPay && <a on-click={() => {
                this.operateHandler('发起支付', async () => {
                  const rs = await testApi.paySubmit({
                    _id: detail._id
                  })
                  window.open(rs.url, '_blank')
                }, { noSuccessHandler: true })

                // 调用支付宝 `alipays://platformapi/startapp?appId=20000067&url=${encodeURI(url)}`
              }}>支付</a>}
              {detail.canRefundApply && <a on-click={() => {
                this.operateHandler('申请退款', async () => {
                  const rs = await testApi.payRefundApply({
                    _id: detail._id
                  })
                  this.updateRow(detail, rs)
                })
              }}>申请退款</a>}
              {detail.canRefund && <a on-click={() => {
                this.operateHandler('退款', async () => {
                  const rs = await testApi.payRefund({
                    _id: detail._id
                  })
                  this.updateRow(detail, rs)
                })
              }}>退款</a>}
              {detail.canCancel && this.storeUser.user.hasAuth(authority.payMgtOperate) && <a on-click={() => {
                this.operateHandler('取消', async () => {
                  const rs = await testApi.payCancel({
                    _id: detail._id
                  })
                  this.updateRow(detail, rs)
                })
              }}>取消</a>}
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
            <PayDetailView detail={this.detail} on-save-success={() => {
              this.detailShow = false
              this.$refs.list.query()
            }} />
          </Modal>
          <MyList
            ref='list'
            hideQueryBtn={{
              add: true
            }}
            queryArgs={{
              orderNo: {
                label: '单号'
              },
              outOrderNo: {
                label: '外部单号'
              },
              anyKey: {
                label: '任意字'
              },
              createdAt: {
                label: '创建时间',
                comp: (query) => <DatePicker class='ivu-input-wrapper' type='daterange' v-model={query['createdAt']} />
              }

            }}
            customQueryNode={<MyTag v-model={this.statusList} />}

            defaultColumn={{
              minWidth: 80
            }}
            columns={this.getColumns()}

            queryFn={async (data) => {
              const rs = await testApi.payQuery(data)
              return rs
            }}

            on-query={(model) => {
              const { createdAt, ...q } = model.query
              this.$router.push({
                path: this.$route.path,
                query: {
                  ...q,
                  createdAtFrom: createdAt[0] ? createdAt[0].toISOString() : undefined,
                  createdAtTo: createdAt[1] ? createdAt[1].toISOString() : undefined,
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
          >
          </MyList>
        </div>
      )
    }
}
