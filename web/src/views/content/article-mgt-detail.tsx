import { Watch } from 'vue-property-decorator'

import { Component } from '@/components/decorator'
import { testApi } from '@/api'
import { myEnum } from '@/config'
import { routerConfig } from '@/router'
import { FormItem } from '@/components/iview'
import { MyEditor } from '@/components/my-editor'

import {
  ContentDetailType,
  ContentDataType,
  ContentMgtDetail,
  ContentLogList,
} from './content-mgt-base'
import { ArticleMgtBase } from './article-mgt'
import { ArticleDetailMain } from './article-detail'

import './article.less'

export type DetailDataType = ContentDataType & {
  content: string
  contentType: number
}
export type DetailType = ContentDetailType<DetailDataType>

@Component
export default class ArticleMgtDetail extends ArticleMgtBase {
  stylePrefix = 'article-mgt-'
  $refs: { detailView: ContentMgtDetail; editor: MyEditor }

  private innerDetail: DetailType = this.getDetailData()
  protected getDetailData() {
    const data = this.getDefaultDetail<DetailDataType>()
    data.detail.content = ''
    data.detail.contentType = myEnum.articleContentType.默认
    data.detail.status = myEnum.articleStatus.草稿
    data.detail.statusText = myEnum.articleStatus.getKey(data.detail.status)
    return data
  }

  private getRules() {
    return {
      content: [{ required: true }],
    }
  }

  private async loadDetailData() {
    const query = this.$route.query
    let data: DetailType
    if (query._id) {
      this.preview = this.$route.path == routerConfig.articleMgtDetail.path
      data = await testApi.articleMgtDetailQuery({ _id: query._id })
      this.setTitle(data.detail.title)
    } else {
      data = this.getDetailData() as any
    }
    this.innerDetail = data
    return data
  }

  async saveFn(submit) {
    const { detail } = this.innerDetail
    return this.$refs.detailView.saveOp.run({
      detail,
      saveFn: async (detail) => {
        const { user, ...restDetail } = detail
        const rs = await testApi.articleMgtSave({
          ...restDetail,
          contentType: this.$refs.editor.currType,
          submit,
        })
        return rs
      },
      submit,
    })
  }

  private renderLog() {
    const { log } = this.innerDetail
    return <ContentLogList log={log} />
  }

  private renderPreview() {
    const { detail } = this.innerDetail
    return (
      <div>
        <ArticleDetailMain data={detail} mgt />
        {this.renderDetailOpBox(detail)}
        {this.renderLog()}
        {this.renderDelConfirm()}
        {this.renderNotPassConfirm()}
      </div>
    )
  }

  uploadFile = []
  private async fileChangeHandler(file) {
    // todo 判断是否同一文件
    let match = this.uploadFile.find((ele) => ele.file === file)
    if (!match) {
      try {
        const rs = testApi.imgUpload(file)
        let t = await rs.result
        match = {
          file,
          url: t.url,
        }
        this.uploadFile.push(match)
      } catch (e) {
        this.$Notice.error({
          title: '上传出错',
          desc: e,
        })
      }
    }
    if (match) {
      this.$refs.editor.insertEmbed('image', match.url)
    }
  }

  protected render() {
    const { detail } = this.innerDetail
    return (
      <ContentMgtDetail
        ref="detailView"
        preview={this.preview}
        loadDetailData={this.loadDetailData}
        getRules={this.getRules}
        renderPreviewFn={this.renderPreview}
      >
        <FormItem label="内容" prop="content">
          <MyEditor
            ref="editor"
            class={this.getStyleName('detail-content')}
            v-model={detail.content}
            type={detail.contentType}
            placeholder="输点啥。。。"
            on-img-change={(file) => {
              this.fileChangeHandler(file)
            }}
          />
        </FormItem>
        {this.renderDetailOpBox(detail)}
        {this.renderDelConfirm()}
      </ContentMgtDetail>
    )
  }
}
