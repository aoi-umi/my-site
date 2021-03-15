import { Component, Vue, Watch } from 'vue-property-decorator'

import { testApi } from '@/api'
import { myEnum, dev } from '@/config'
import { routerConfig } from '@/router'
import { FormItem, Button, Divider, Input, Icon, Affix, Card } from '@/components/iview'
import { MyUpload, IMyUpload, FileDataType, FileType } from '@/components/my-upload'

import { VideoMgtBase } from './video-mgt'
import { ContentDetailType, ContentDataType, ContentMgtDetail, ContentMgtDetailView, ContentLogListView } from './content-mgt-base'

import './video.less'
import { VideoDetailMainView } from './video-detail'

export type DetailDataType = ContentDataType & {
  videoIdList: string[];
  videoList: { _id: string, url: string, contentType: string }[];
};
export type DetailType = ContentDetailType<DetailDataType>;

@Component
export default class VideoMgtDetail extends VideoMgtBase {
  stylePrefix = 'video-mgt-';
  $refs: { detailView: ContentMgtDetail, upload: IMyUpload };

  private innerDetail: DetailType = this.getDetailData();
  protected getDetailData () {
    const data = this.getDefaultDetail<DetailDataType>()
    data.detail.videoIdList = []
    data.detail.status = myEnum.videoStatus.草稿
    data.detail.statusText = myEnum.videoStatus.getKey(data.detail.status)
    return data
  }

  private getRules () {
    return {
      cover: {
        required: true
      },
      videoIdList: {
        required: true
      }
    }
  }

  videoList: FileType[] = [];
  private async loadDetailData () {
    const query = this.$route.query
    let detail: DetailType
    if (query._id) {
      this.preview = this.$route.path == routerConfig.videoMgtDetail.path
      detail = await testApi.videoMgtDetailQuery({ _id: query._id })
      this.videoList = detail.detail.videoList.map(ele => {
        return { url: ele.url, fileType: FileDataType.视频, originFileType: ele.contentType }
      })
      if (query.repost) {
        detail.detail._id = ''
      }
    } else {
      detail = this.getDetailData() as any
    }
    this.innerDetail = detail
    return detail
  }

  private async beforeValidFn (detail: DetailDataType) {
    await this.operateHandler('上传视频', async () => {
      const upload = this.$refs.upload
      const err = await upload.upload()
      if (err.length) {
        throw new Error(err.join(','))
      }
      const file = upload.fileList[0]
      if (file && file.uploadRes) {
        detail.videoIdList = [file.uploadRes]
      }
    }, { noSuccessHandler: true })
  }

  private async saveFn (detail: DetailDataType, submit) {
    const { user, ...restDetail } = detail
    const rs = await testApi.videoMgtSave({
      ...restDetail,
      submit
    })
    return rs
  }

  private renderLog () {
    const { log } = this.innerDetail
    return (
      <ContentLogListView log={log} />
    )
  }

  private renderPreview () {
    const { detail } = this.innerDetail
    return (
      <div>
        <VideoDetailMainView data={detail} />
        {this.renderDetailOpBox(detail)}
        {this.renderLog()}
        {this.renderDelConfirm()}
        {this.renderNotPassConfirm()}
      </div>
    )
  }

  render () {
    const videoSize = 20
    return (
      <ContentMgtDetailView ref='detailView'
        preview={this.preview}
        loadDetailData={this.loadDetailData}
        getRules={this.getRules}
        beforeValidFn={this.beforeValidFn}
        saveFn={this.saveFn}
        saveSuccessFn={() => {
          this.toList()
        }}
        renderPreviewFn={this.renderPreview}
      >
        <FormItem label='视频' prop='videoIdList'>
          <MyUpload ref='upload' width={videoSize * 16} height={videoSize * 9}
            headers={testApi.defaultHeaders}
            uploadUrl={testApi.videoUploadUrl}
            maxSize={1024 * 500}
            format={['mp4']}
            successHandler={(res, file) => {
              const rs = testApi.uplodaHandler(res)
              file.url = rs.url
              return rs.fileId
            }}
            uploadIconType={FileDataType.视频}
            showVideoCrop
            on-video-crop={(crop, item) => {
              if (!crop || !crop.data) { return }
              const file = new File([], '截图', { type: crop.type })
              this.$refs.detailView.$refs.cover.setFile({
                data: crop.data,
                file: file,
                fileType: FileDataType.图片
              })
            }}
            v-model={this.videoList}
          >
          </MyUpload>
        </FormItem>
      </ContentMgtDetailView>
    )
  }
}
