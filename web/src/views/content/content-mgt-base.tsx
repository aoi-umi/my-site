import { Component, Vue, Watch } from 'vue-property-decorator'
import * as iview from 'iview'

import { Prop } from '@/components/property-decorator'
import { testApi } from '@/api'
import { myEnum, dev } from '@/config'
import { routerConfig } from '@/router'
import { convClass, getCompOpts } from '@/components/utils'
import { Form, FormItem, Button, Modal, Input, Divider, Checkbox, DatePicker, Affix, Card } from '@/components/iview'
import { MyConfirm } from '@/components/my-confirm'
import { MyList } from '@/components/my-list'
import { MyUpload, IMyUpload, FileDataType } from '@/components/my-upload'
import { IMyLoad, MyLoad } from '@/components/my-load'

import { UserAvatarView } from '../comps/user-avatar'
import { Base } from '../base'
export class ContentDetailType<T extends ContentDataType = ContentDataType> {
  detail: T;
  log?: any[];
  static create<T extends ContentDataType> (): ContentDetailType<T> {
    const data = {
      detail: {
        _id: '',
        cover: '',
        coverUrl: '',
        title: '',
        profile: '',
        statusText: '',
        remark: ''
      } as any as T,
      log: []
    }
    return data
  }
}

export type ContentDataType = {
  _id: string;
  cover: string;
  coverUrl: string;
  title: string;
  profile: string;
  status: number;
  statusText: string;
  createdAt: string;
  remark: string;
  readTimes: number;
  commentCount: number;
  like: number;
  dislike: number;
  favourite: number;
  setPublish: boolean;
  setPublishAt: Date;
  publishAt: string;
  userId: string;

  voteValue: number;
  favouriteValue: boolean;
  canUpdate: boolean;
  canDel: boolean;
  user: { _id: string; nickname: string; account: string };

  _disabled?: boolean;
  _checked?: boolean;
};

type OpType = { text: string, type?: string, fn: () => any }

export interface IContentMgtBase {
  contentMgtType: string;
  auditFn(detail: ContentDataType, pass: boolean): Promise<{ status, statusText }>;
  canAudit(detail: ContentDataType): boolean;
  toDetailUrl(preview: boolean): string;
  isDel(detail: ContentDataType): boolean;
  delFn(): Promise<any>;
}
@Component({
  extends: Base
})
export class ContentMgtBase extends Vue<IContentMgtBase & Base> {
  delShow = false;
  delIds = [];
  delRemark = '';
  notPassShow = false;
  notPassRemark = '';
  operateDetail: ContentDataType;
  protected preview = false;

  protected getDefaultDetail<T extends ContentDataType = ContentDataType> () {
    const data = ContentDetailType.create<T>()
    return data
  }

  protected toggleNotPass (show: boolean) {
    this.notPassShow = show
    this.notPassRemark = ''
  }

  protected auditSuccessHandler (detail) {
    this.toList()
  }

  protected async audit (detail: ContentDataType, pass: boolean) {
    await this.operateHandler('审核', async () => {
      const rs = await this.auditFn(detail, pass)
      detail.status = rs.status
      detail.statusText = rs.statusText
      this.auditSuccessHandler(detail)
      this.toggleNotPass(false)
    })
  }

  protected toList () {
    this.$router.push({
      path: routerConfig.contentMgt.path,
      query: {
        tab: this.contentMgtType as any
      }
    })
  }

  protected toDetail (_id?, opt?: {
    preview?: boolean,
    repost?: boolean,
  }) {
    opt = {
      ...opt
    }
    this.$router.push({
      path: this.toDetailUrl(opt.preview),
      query: { _id: _id || '', repost: opt.repost ? 'true' : '' }
    })
  }

  protected getOperate (detail: ContentDataType, opt?: { noPreview?: boolean; isDetail?: boolean; }) {
    opt = { ...opt }
    let operate: OpType[] = []
    if (this.canAudit(detail)) {
      operate = [...operate, {
        text: '审核通过',
        type: 'primary',
        fn: () => {
          this.audit(detail, true)
        }
      }, {
        text: '审核不通过',
        fn: () => {
          this.operateDetail = detail
          this.toggleNotPass(true)
        }
      }]
    }
    if (detail.canUpdate) {
      operate.push({
        text: '修改',
        fn: () => {
          if (opt.isDetail) { this.preview = false } else { this.toDetail(detail._id) }
        }
      })
    }
    if (!opt.noPreview) {
      operate.push({
        text: '预览',
        fn: () => {
          this.toDetail(detail._id, { preview: true })
        }
      })
    }
    if (detail.canDel) {
      operate.push({
        text: '删除',
        fn: () => {
          this.delIds = [detail._id]
          this.delShow = true
        }
      })
    }
    if (detail.user._id === this.storeUser.user._id && this.isDel(detail)) {
      operate.push({
        text: '重投',
        fn: () => {
          this.toDetail(detail._id, { repost: true })
        }
      })
    }
    return operate
  }

  protected renderListOpBox (detail: ContentDataType, opt?: { noPreview?: boolean; isDetail?: boolean; }) {
    return (
      <div class={['content-mgt-item-op-box', 'button-group-normal']}>
        {
          this.getOperate(detail, opt).map(ele => {
            return (
              <Button type={ele.type as any} on-click={ele.fn}>
                {ele.text}
              </Button>
            )
          })
        }
      </div>
    )
  }

  protected renderDetailOpBox (detail: ContentDataType) {
    const operate = this.getOperate(detail, { noPreview: true, isDetail: true })
    return (operate.length &&
      <div>
        <Divider />
        <Affix offset-bottom={40}>
          <Card class='button-group-normal'>
            {operate.map(ele => {
              return (
                <Button type={ele.type as any} on-click={ele.fn}>
                  {ele.text}
                </Button>
              )
            })}
          </Card>
        </Affix>
      </div>
    )
  }

  protected renderNotPassConfirm () {
    return (
      <Modal v-model={this.notPassShow} footer-hide>
        <MyConfirm title='审核不通过' loading={true}
          cancel={() => {
            this.toggleNotPass(false)
          }}
          ok={() => {
            return this.audit(this.operateDetail, false)
          }}>
          备注: <Input v-model={this.notPassRemark} />
        </MyConfirm>
      </Modal>
    )
  }

  protected renderDelConfirm () {
    return (
      <Modal v-model={this.delShow} footer-hide>
        <MyConfirm title='确认删除?' loading={true}
          cancel={() => {
            this.delShow = false
          }}
          ok={async () => {
            await this.delClick()
          }}>
          <p>将要删除{this.delIds.length}项</p>
          <p>备注: <Input v-model={this.delRemark} /></p>
        </MyConfirm>
      </Modal>
    )
  }

  protected delSuccessHandler () {
    this.toList()
  }
  async delClick () {
    await this.operateHandler('删除', async () => {
      await this.delFn()
      this.delIds = []
      this.delShow = false
      this.delRemark = ''
      this.delSuccessHandler()
    })
  }
}

class ContentMgtDetailProp {
  @Prop({
    required: true
  })
  loadDetailData: () => Promise<ContentDetailType>;

  @Prop()
  getRules?: () => any;

  @Prop()
  beforeValidFn?: (detail) => Promise<any>;

  @Prop({
    required: true
  })
  saveFn: (detail, submit: boolean) => Promise<any>;

  @Prop({
    required: true
  })
  saveSuccessFn: (rs) => void;

  @Prop()
  preview?: boolean;

  @Prop({
    required: true
  })
  renderPreviewFn: (detail) => any;
}
@Component({
  extends: Base,
  mixins: [getCompOpts(ContentMgtDetailProp)]
})
export class ContentMgtDetail extends Vue<ContentMgtDetailProp & Base> {
  $refs: { formVaild: iview.Form, cover: IMyUpload, loadView: IMyLoad };

  @Watch('$route')
  route (to, from) {
    this.$refs.loadView.loadData()
  }

  innerDetail: ContentDetailType = null;

  rules = {};
  private getCommonRules () {
    return {
      title: [
        { required: true, trigger: 'blur' }
      ],
      setPublishAt: [{
        validator: (rule, value, callback) => {
          const { detail } = this.innerDetail
          if (detail.setPublish && !detail.setPublishAt) {
            callback(new Error('请填写发布时间'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }]
    }
  }

  private setRules () {
    const rule = this.getRules ? this.getRules() : {}
    this.rules = {
      ...this.getCommonRules(),
      ...rule
    }
  }

  private coverList = [];
  private async loadDetail () {
    const detailInfo = await this.loadDetailData()
    const detail = detailInfo.detail
    this.coverList = detail.coverUrl ? [{ url: detail.coverUrl, fileType: FileDataType.图片 }] : []
    if (detail.setPublishAt) { detail.setPublishAt = new Date(detail.setPublishAt) }
    this.innerDetail = detailInfo
    this.setRules()
    return detailInfo
  }

  async uploadCover () {
    const upload = this.$refs.cover
    const err = await upload.upload()
    if (err.length) {
      throw new Error('上传封面出错:' + err.join(','))
    }
    const file = upload.fileList[0]
    return file
  }

  private saving = false;
  private async handleSave (submit?: boolean) {
    this.saving = true
    const { detail } = this.innerDetail
    let rs
    await this.operateHandler('保存', async () => {
      rs = await this.saveFn(detail, submit)
    }, {
      validate: this.$refs.formVaild.validate,
      beforeValid: async () => {
        const file = await this.uploadCover()
        if (!file) { detail.cover = '' } else if (file.uploadRes) { detail.cover = file.uploadRes }
        this.beforeValidFn && await this.beforeValidFn(detail)
      },
      onSuccessClose: () => {
        this.saveSuccessFn(rs)
      }
    }).finally(() => {
      this.saving = false
    })
  }

  protected render () {
    return (
      <MyLoad
        ref='loadView'
        loadFn={this.loadDetail}
        renderFn={() => {
          if (!this.preview) { return this.renderEdit() }
          return this.renderPreviewFn(this.innerDetail)
        }}
      />
    )
  }

  protected renderHeader (detail: ContentDataType) {
    return (
      <div>
        <UserAvatarView user={detail.user} />
        {[
          '状态: ' + detail.statusText,
          '创建于: ' + this.$utils.dateFormat(detail.createdAt),
          detail.publishAt && ('发布于:' + this.$utils.dateFormat(detail.publishAt))
        ].map(ele => {
          return (<span class='not-important' style={{ marginLeft: '5px' }}>{ele}</span>)
        })}
      </div>
    )
  }

  protected renderLog () {
    const { log } = this.innerDetail
    return (
      <ContentLogListView log={log} />
    )
  }

  protected renderEdit () {
    const { detail } = this.innerDetail
    return (
      <div>
        <h3>{detail._id ? '修改' : '新增'}</h3>
        <Form ref='formVaild' label-position='top' props={{ model: detail }} rules={this.rules}>
          <FormItem label='' prop='header' v-show={!detail._id}>
            {!!detail._id && this.renderHeader(detail)}
          </FormItem>
          <FormItem label='封面' prop='cover'>
            <MyUpload
              ref='cover'
              headers={testApi.defaultHeaders}
              uploadUrl={testApi.imgUploadUrl}
              successHandler={(res, file) => {
                const rs = testApi.uplodaHandler(res)
                file.url = rs.url
                return rs.fileId
              }}
              format={['jpg', 'jpeg', 'png', 'bmp', 'gif']}
              width={160} height={90}
              v-model={this.coverList}
            />
          </FormItem>
          <FormItem label='标题' prop='title'>
            <Input v-model={detail.title} />
          </FormItem>
          <FormItem label='简介' prop='profile'>
            <Input v-model={detail.profile} type='textarea' />
          </FormItem>
          {this.$slots.default}
          <FormItem prop='setPublishAt'>
            <label style={{ marginRight: '5px' }}>
              <Checkbox v-model={detail.setPublish} />
                            指定时间发布
            </label>
            <DatePicker v-model={detail.setPublishAt} type='datetime' options={{
              disabledDate: (date?: Date) => {
                const start = this.$moment().startOf('day')
                const end = this.$moment(start).add(3, 'd')
                return date && (date.valueOf() < start.valueOf() || date.valueOf() >= end.valueOf())
              }
            }} />
          </FormItem>
          <FormItem label='备注' prop='remark'>
            <Input v-model={detail.remark} />
          </FormItem>
          {(!detail._id || detail.canUpdate) &&
            <Affix offset-bottom={40}>
              <Card class='button-group-normal'>
                <Button on-click={() => {
                  this.handleSave(false)
                }} loading={this.saving}>保存草稿</Button>
                <Button type='primary' on-click={() => {
                  this.handleSave(true)
                }} loading={this.saving}>发布</Button>
              </Card>
            </Affix>
          }
        </Form>
        {this.renderLog()}
      </div >
    )
  }
}

export const ContentMgtDetailView = convClass<ContentMgtDetailProp>(ContentMgtDetail)

class ContentLogListProp {
  @Prop({
    default: () => []
  })
  log: any[];
}
@Component({
  extends: Base,
  mixins: [getCompOpts(ContentLogListProp)]
})
export class ContentLogList extends Vue<ContentLogListProp & Base> {
  render () {
    const log = this.log
    return (
      <div>
        {log.length > 0 &&
          <div>
            <Divider size='small' />
            <MyList
              hideSearchBox
              hidePage
              columns={[{
                title: '操作人',
                key: 'user',
                render: (h, params) => {
                  return <UserAvatarView style={{ margin: '5px' }} user={params.row.user} />
                }
              }, {
                title: '源状态',
                key: 'srcStatusText'
              }, {
                title: '目状态',
                key: 'destStatusText'
              }, {
                title: '备注',
                key: 'remark'
              }, {
                title: '操作时间',
                key: 'createdAt',
                render: (h, params) => {
                  return <span>{this.$utils.dateFormat(params.row.createdAt)}</span>
                }
              }]}
              data={log}>
            </MyList>
          </div>
        }
      </div>
    )
  }
}

export const ContentLogListView = convClass<ContentLogListProp>(ContentLogList)
