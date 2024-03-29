import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop, Confirm } from '@/components/decorator'
import { testApi } from '@/api'
import { myEnum, dev } from '@/config'
import { routerConfig } from '@/router'
import { OperateModel } from '@/helpers'
import {
  Form,
  FormItem,
  Button,
  Modal,
  Input,
  Divider,
  Checkbox,
  DatePicker,
  Affix,
  Card,
  Spin,
} from '@/components/iview'
import { MyConfirm } from '@/components/my-confirm'
import { MyList } from '@/components/my-list'
import { MyUpload, FileDataType } from '@/components/my-upload'
import { MyLoad } from '@/components/my-load'
import { MyTag } from '@/components/my-tag'

import { UserAvatar } from '../comps/user-avatar'
import { Base } from '../base'
import { OperateDataType, OperateButton } from '../comps/operate-button'
export class ContentDetailType<T extends ContentDataType = ContentDataType> {
  detail: T
  log?: any[]
  static create<T extends ContentDataType>(): ContentDetailType<T> {
    const data = {
      detail: {
        _id: '',
        cover: '',
        coverUrl: '',
        title: '',
        profile: '',
        statusText: '',
        remark: '',
      } as any as T,
      log: [],
    }
    return data
  }
}

export type ContentDataType = {
  _id: string
  cover: string
  coverUrl: string
  title: string
  profile: string
  status: number
  statusText: string
  createdAt: string
  remark: string
  readTimes: number
  commentCount: number
  like: number
  dislike: number
  favourite: number
  setPublish: boolean
  setPublishAt: Date
  publishAt: string
  userId: string

  voteValue: number
  favouriteValue: boolean
  canUpdate: boolean
  canDel: boolean
  canRecovery: boolean
  user: { _id: string; nickname: string; account: string }

  _disabled?: boolean
  _checked?: boolean
}

type OpType = OperateDataType

export interface IContentMgtBase {
  contentMgtType: string
  auditFn(
    detail: ContentDataType,
    pass: boolean,
  ): Promise<{ status; statusText }>
  canAudit(detail: ContentDataType): boolean
  toDetailUrl(preview: boolean): string
  isDel(detail: ContentDataType): boolean
  delFn(): Promise<any>
  saveFn?(submit: boolean): Promise<any>
  recoveryFn(detail: ContentDataType): Promise<any>
  canRecovery(detail: ContentDataType): boolean
}

type ToDetailOptions = {
  preview?: boolean
  repost?: boolean
  refresh?: boolean
}
@Component({
  extends: Base,
})
export class ContentMgtBase extends Vue<{}, IContentMgtBase & Base> {
  delShow = false
  delIds = []
  delRemark = ''
  notPassShow = false
  notPassRemark = ''
  operateDetail: ContentDataType
  protected preview = false
  protected op: OperateModel<{
    operate: string
    detail?: ContentDataType
    data?: any
  }> = null

  protected created() {
    this.initOp()
  }

  private initOp() {
    this.op = new OperateModel({
      fn: async (args) => {
        // await this.$utils.wait(3000)
        let { operate, detail, data } = args
        switch (operate) {
          case myEnum.contentMgtOperate.审核通过:
            return this.audit(detail, true)
          case myEnum.contentMgtOperate.审核不通过:
            return this.audit(detail, false)
          case myEnum.contentMgtOperate.恢复:
            return this.recovery(detail)
          case myEnum.contentMgtOperate.删除:
            return this.del()
          case myEnum.contentMgtOperate.保存:
            return this.saveFn(data.submit)
        }
      },
    })
  }

  protected getDefaultDetail<T extends ContentDataType = ContentDataType>() {
    const data = ContentDetailType.create<T>()
    return data
  }

  protected toggleNotPass(show: boolean) {
    this.notPassShow = show
    this.notPassRemark = ''
  }

  protected auditSuccessHandler(detail) {
    this.toList()
  }

  @Confirm('确认通过?')
  protected auditPassClick(detail: ContentDataType) {
    return this.op.run({
      operate: myEnum.contentMgtOperate.审核通过,
      detail,
    })
  }

  private async audit(detail: ContentDataType, pass: boolean) {
    const rs = await this.auditFn(detail, pass)
    detail.status = rs.status
    detail.statusText = rs.statusText
    this.auditSuccessHandler(detail)
    this.toggleNotPass(false)
  }

  @Confirm('确认恢复?')
  protected async recoveryClick(detail: ContentDataType) {
    await this.op.run({
      operate: myEnum.contentMgtOperate.恢复,
      detail,
    })
  }

  private async recovery(detail: ContentDataType) {
    const rs = await this.recoveryFn(detail)
    this.toDetail(detail._id, { preview: true, refresh: true })
  }

  protected toList() {
    this.goToPage({
      path: routerConfig.contentMgt.path,
      query: {
        tab: this.contentMgtType as any,
      },
    })
  }

  protected toDetail(_id?, opt?: ToDetailOptions) {
    this.goToPage(this.getToDetailObject(_id, opt))
  }

  private getToDetailObject(_id, opt?: ToDetailOptions) {
    opt = {
      ...opt,
    }
    return {
      path: this.toDetailUrl(opt.preview),
      query: {
        _id: _id || undefined,
        repost: opt.repost ? 'true' : undefined,
        t: opt.refresh ? String(Date.now()) : undefined,
      },
    }
  }

  protected getOperate(detail: ContentDataType, opt?: { isDetail?: boolean }) {
    opt = { ...opt }
    let operate: OpType[] = []
    if (opt.isDetail && !this.preview && (!detail._id || detail.canUpdate)) {
      operate = [
        ...operate,
        {
          text: '保存草稿',
          fn: () => {
            this.saveClick(false)
          },
        },
        {
          text: '发布',
          type: 'primary',
          fn: () => {
            this.saveClick(true)
          },
        },
      ]
    }
    if (this.canAudit(detail)) {
      operate = [
        ...operate,
        {
          text: '审核通过',
          type: 'primary',
          fn: () => {
            this.auditPassClick(detail)
          },
        },
        {
          text: '审核不通过',
          fn: () => {
            this.operateDetail = detail
            this.toggleNotPass(true)
          },
        },
      ]
    }
    if ((!opt.isDetail || this.preview) && detail.canUpdate) {
      let update: any = {
        text: '修改',
      }
      if (opt.isDetail) {
        update.fn = () => {
          if (opt.isDetail) {
            this.preview = false
          }
        }
      } else {
        update.to = this.$utils.getUrl(this.getToDetailObject(detail._id))
      }
      operate.push(update)
    }
    if (!opt.isDetail) {
      operate.push({
        text: '预览',
        to: this.$utils.getUrl(
          this.getToDetailObject(detail._id, { preview: true }),
        ),
      })
    }
    if (detail.canDel) {
      operate.push({
        text: '删除',
        type: 'error',
        fn: () => {
          this.delIds = [detail._id]
          this.delShow = true
        },
      })
    }
    if (opt.isDetail && detail._id && this.canRecovery(detail)) {
      operate.push({
        text: '恢复',
        fn: () => {
          this.recoveryClick(detail)
        },
      })
    }
    if (
      this.storeUser.user.equalsId(detail.user?._id) &&
      detail._id &&
      this.isDel(detail)
    ) {
      operate.push({
        text: '重投',
        to: this.$utils.getUrl(
          this.getToDetailObject(detail._id, { repost: true }),
        ),
      })
    }

    const defaultData = {
      tag: 'i-button',
    }
    operate = operate.map((ele) => {
      return {
        ...defaultData,
        ...ele,
      }
    })
    return operate
  }

  protected renderListOpBox(
    detail: ContentDataType,
    opt?: { noPreview?: boolean; isDetail?: boolean },
  ) {
    return (
      <div
        class={['content-mgt-item-op-box', 'button-group-normal']}
        style="position: relative"
      >
        {this.op.loading && <Spin fix />}
        {this.getOperate(detail, opt).map((ele) => {
          return <OperateButton data={ele}></OperateButton>
        })}
      </div>
    )
  }

  protected renderDetailOpBox(detail: ContentDataType) {
    const operate = this.getOperate(detail, { isDetail: true })
    return (
      operate.length > 0 && (
        <div>
          <Divider />
          <Affix offset-bottom={40}>
            <Card class="button-group-normal">
              {this.op.loading && <Spin fix />}
              {operate.map((ele) => {
                return <OperateButton data={ele}></OperateButton>
              })}
            </Card>
          </Affix>
        </div>
      )
    )
  }

  protected renderNotPassConfirm() {
    return (
      <Modal v-model={this.notPassShow} footer-hide>
        <MyConfirm
          title="审核不通过"
          loading={true}
          cancel={() => {
            this.toggleNotPass(false)
          }}
          ok={() => {
            return this.op.run({
              operate: myEnum.contentMgtOperate.审核不通过,
              detail: this.operateDetail,
            })
          }}
        >
          备注: <Input v-model={this.notPassRemark} />
        </MyConfirm>
      </Modal>
    )
  }

  protected renderDelConfirm() {
    return (
      <Modal v-model={this.delShow} footer-hide>
        <MyConfirm
          title="确认删除?"
          loading={true}
          cancel={() => {
            this.delShow = false
          }}
          ok={async () => {
            await this.delClick()
          }}
        >
          <p>将要删除{this.delIds.length}项</p>
          <p>
            备注: <Input v-model={this.delRemark} />
          </p>
        </MyConfirm>
      </Modal>
    )
  }

  protected delSuccessHandler() {
    this.toList()
  }
  async delClick() {
    return this.op.run({
      operate: myEnum.contentMgtOperate.删除,
    })
  }
  private async del() {
    await this.delFn()
    this.delIds = []
    this.delShow = false
    this.delRemark = ''
    this.delSuccessHandler()
  }

  protected saveSuccessHandler() {
    this.toList()
  }
  async saveClick(submit: boolean) {
    return this.op.run({
      operate: myEnum.contentMgtOperate.保存,
      data: { submit },
      options: {
        onSuccessClose: () => {
          this.saveSuccessHandler()
        },
      },
    })
  }
}

class ContentMgtDetailProp {
  @Prop({
    required: true,
  })
  loadDetailData: () => Promise<ContentDetailType>

  @Prop()
  getRules?: () => any

  @Prop()
  beforeValidFn?: (detail) => Promise<any>

  @Prop()
  preview?: boolean

  @Prop({
    required: true,
  })
  renderPreviewFn: (detail) => any
}
@Component({
  extends: Base,
  props: ContentMgtDetailProp,
})
export class ContentMgtDetail extends Vue<ContentMgtDetailProp, Base> {
  $refs: { formVaild: iView.Form; cover: MyUpload; loadView: MyLoad }

  protected isRepost = false
  @Watch('$route')
  route(to, from) {
    this.$refs.loadView.loadData()
  }

  innerDetail: ContentDetailType = null
  saveOp: OperateModel<{
    detail: ContentDataType
    submit: boolean
    saveFn: (detail) => Promise<any>
  }> = null

  protected created() {
    this.initSaveOp()
  }

  private initSaveOp() {
    this.saveOp = new OperateModel({
      prefix: '保存',
      beforeValid: async (args) => {
        let { detail } = args
        const file = await this.uploadCover()
        if (!file) {
          detail.cover = ''
        } else if (file.uploadRes) {
          detail.cover = file.uploadRes
        }
        this.beforeValidFn && (await this.beforeValidFn(detail))
      },
      validate: (args) => {
        let { submit } = args
        if (!submit) return true
        return this.$refs.formVaild.validate()
      },
      fn: async (args) => {
        let { detail, saveFn } = args
        return await saveFn(detail)
      },
      noDefaultHandler: true,
      throwError: true,
    })
  }

  rules = {}
  private getCommonRules() {
    return {
      title: [{ required: true }],
      setPublishAt: [
        {
          validator: (rule, value, callback) => {
            const { detail } = this.innerDetail
            if (detail.setPublish && !detail.setPublishAt) {
              callback(new Error('请填写发布时间'))
            } else {
              callback()
            }
          },
        },
      ],
    }
  }

  private setRules() {
    const rule = this.getRules ? this.getRules() : {}
    this.rules = {
      ...this.getCommonRules(),
      ...rule,
    }
  }

  private coverList = []
  private async loadDetail() {
    const query = this.$route.query
    const detailInfo = await this.loadDetailData()
    if (query.repost) {
      detailInfo.detail._id = ''
      this.isRepost = true
    }
    const detail = detailInfo.detail
    this.coverList = detail.coverUrl
      ? [{ url: detail.coverUrl, fileType: FileDataType.图片 }]
      : []
    if (detail.setPublishAt) {
      detail.setPublishAt = new Date(detail.setPublishAt)
    }
    this.innerDetail = detailInfo
    this.setRules()
    return detailInfo
  }

  async uploadCover() {
    const upload = this.$refs.cover
    const err = await upload.upload()
    if (err.length) {
      throw new Error('上传封面出错:' + err.join(','))
    }
    const file = upload.fileList[0]
    return file
  }

  protected render() {
    return (
      <MyLoad
        ref="loadView"
        loadFn={this.loadDetail}
        renderFn={() => {
          if (!this.preview) {
            return this.renderEdit()
          }
          return this.renderPreviewFn(this.innerDetail)
        }}
      />
    )
  }

  protected renderHeader(detail: ContentDataType) {
    return (
      <div>
        <UserAvatar user={detail.user} />
        {[
          '创建于: ' + this.$utils.dateFormat(detail.createdAt),
          detail.publishAt &&
            '发布于:' + this.$utils.dateFormat(detail.publishAt),
        ].map((ele) => {
          return (
            <span class="not-important" style={{ marginLeft: '5px' }}>
              {ele}
            </span>
          )
        })}
      </div>
    )
  }

  protected renderLog() {
    const { log } = this.innerDetail
    return <ContentLogList log={log} />
  }

  protected renderEdit() {
    const { detail } = this.innerDetail
    return (
      <div>
        <div class="flex">
          <h3 class="flex-stretch">{detail._id ? '修改' : '新增'}</h3>
          <MyTag value={detail.statusText} />
        </div>
        <br />
        <Form
          ref="formVaild"
          label-position="top"
          props={{ model: detail }}
          rules={this.rules}
        >
          {detail._id && (
            <FormItem label="" prop="header">
              {this.renderHeader(detail)}
            </FormItem>
          )}
          <FormItem label="标题" prop="title">
            <Input v-model={detail.title} />
          </FormItem>
          <FormItem label="封面" prop="cover">
            <MyUpload
              ref="cover"
              headers={testApi.defaultHeaders}
              uploadUrl={testApi.imgUploadUrl}
              successHandler={(res, file) => {
                const rs = testApi.uplodaHandler(res)
                file.url = rs.url
                return rs.fileId
              }}
              format={['jpg', 'jpeg', 'png', 'bmp', 'gif']}
              width={160}
              height={90}
              v-model={this.coverList}
              showProgress
            />
          </FormItem>
          <FormItem label="简介" prop="profile">
            <Input v-model={detail.profile} type="textarea" />
          </FormItem>
          {this.$slots.default}
          <FormItem prop="setPublishAt">
            <label style={{ marginRight: '5px' }}>
              <Checkbox v-model={detail.setPublish} />
              指定时间发布
            </label>
            <DatePicker
              v-model={detail.setPublishAt}
              type="datetime"
              options={{
                disabledDate: (date?: Date) => {
                  const start = this.$moment().startOf('day')
                  const end = this.$moment(start).add(3, 'd')
                  return (
                    date &&
                    (date.valueOf() < start.valueOf() ||
                      date.valueOf() >= end.valueOf())
                  )
                },
              }}
            />
          </FormItem>
          <FormItem label="备注" prop="remark">
            <Input v-model={detail.remark} />
          </FormItem>
        </Form>
        {this.renderLog()}
      </div>
    )
  }
}

class ContentLogListProp {
  @Prop({
    default: () => [],
  })
  log: any[]
}
@Component({
  extends: Base,
  props: ContentLogListProp,
})
export class ContentLogList extends Vue<ContentLogListProp, Base> {
  render() {
    const log = this.log
    return (
      <div>
        {log.length > 0 && (
          <div>
            <Divider size="small" />
            <MyList
              hideSearchBox
              columns={[
                {
                  title: '操作人',
                  key: 'user',
                  render: (h, params) => {
                    return (
                      <UserAvatar
                        style={{ margin: '5px' }}
                        user={params.row.user}
                      />
                    )
                  },
                },
                {
                  title: '源状态',
                  key: 'srcStatusText',
                },
                {
                  title: '目状态',
                  key: 'destStatusText',
                },
                {
                  title: '备注',
                  key: 'remark',
                },
                {
                  title: '操作时间',
                  key: 'createdAt',
                  render: (h, params) => {
                    return (
                      <span>
                        {this.$utils.dateFormat(params.row.createdAt)}
                      </span>
                    )
                  },
                },
              ]}
              data={log}
            ></MyList>
          </div>
        )}
      </div>
    )
  }
}
