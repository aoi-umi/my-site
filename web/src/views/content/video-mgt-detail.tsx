import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop } from '@/components/decorator'
import { testApi } from '@/api'
import { myEnum, dev } from '@/config'
import { routerConfig } from '@/router'
import {
  FormItem,
  Button,
  Divider,
  Input,
  Icon,
  Affix,
  Card,
} from '@/components/iview'
import { MyUpload, FileDataType, FileType } from '@/components/my-upload'

import { VideoMgtBase } from './video-mgt'
import {
  ContentDetailType,
  ContentDataType,
  ContentMgtDetail,
  ContentLogList,
} from './content-mgt-base'
import { VideoDetailMain } from './video-detail'

import './video.less'

export type DetailDataType = ContentDataType & {
  videoIdList: string[]
  videoList: { _id: string; url: string; contentType: string }[]
}
export type DetailType = ContentDetailType<DetailDataType>

@Component
export default class VideoMgtDetail extends VideoMgtBase {
  stylePrefix = 'video-mgt-'
  $refs: { detailView: ContentMgtDetail; upload: MyUpload }

  private innerDetail: DetailType = this.getDetailData()
  protected getDetailData() {
    const data = this.getDefaultDetail<DetailDataType>()
    data.detail.videoIdList = []
    data.detail.status = myEnum.videoStatus.草稿
    data.detail.statusText = myEnum.videoStatus.getKey(data.detail.status)
    return data
  }

  private getRules() {
    return {
      cover: {
        required: true,
      },
      videoIdList: {
        required: true,
      },
    }
  }

  videoList: FileType[] = []
  private async loadDetailData() {
    const query = this.$route.query
    let data: DetailType
    if (query._id) {
      this.preview = this.$route.path == routerConfig.videoMgtDetail.path
      data = await testApi.videoMgtDetailQuery({ _id: query._id })
      this.videoList = data.detail.videoList.map((ele) => {
        return {
          url: ele.url,
          fileType: FileDataType.视频,
          originFileType: ele.contentType,
        }
      })
      this.setTitle(data.detail.title)
    } else {
      data = this.getDetailData() as any
    }
    this.innerDetail = data
    return data
  }

  private async beforeValidFn(detail: DetailDataType) {
    await this.operateHandler(
      '上传视频',
      async () => {
        const upload = this.$refs.upload
        const err = await upload.upload()
        if (err.length) {
          throw new Error(err.join(','))
        }
        const file = upload.fileList[0]
        if (file && file.uploadRes) {
          detail.videoIdList = [file.uploadRes]
        }
      },
      { noSuccessHandler: true, throwError: true },
    )
  }

  async saveFn(submit) {
    const { detail } = this.innerDetail
    return this.$refs.detailView.saveOp.run({
      detail,
      saveFn: async (detail) => {
        const { user, ...restDetail } = detail
        const rs = await testApi.videoMgtSave({
          ...restDetail,
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
        <VideoDetailMain data={detail} mgt />
        {this.renderDetailOpBox(detail)}
        {this.renderLog()}
        {this.renderDelConfirm()}
        {this.renderNotPassConfirm()}
      </div>
    )
  }

  render() {
    const { detail } = this.innerDetail
    const videoSize = 20
    return (
      <ContentMgtDetail
        ref="detailView"
        preview={this.preview}
        loadDetailData={this.loadDetailData}
        getRules={this.getRules}
        beforeValidFn={this.beforeValidFn}
        renderPreviewFn={this.renderPreview}
      >
        <FormItem label="视频" prop="videoIdList">
          <MyUpload
            ref="upload"
            width={videoSize * 16}
            height={videoSize * 9}
            headers={testApi.defaultHeaders}
            uploadUrl={testApi.fileUploadByChunksUrl}
            uploadCheckUrl={testApi.fileUploadCheckUrl}
            uploadByChunks
            maxSize={1024 * 500}
            format={['mp4']}
            resHandler={(res) => {
              return testApi.resHandler(res)
            }}
            successHandler={(rs, file) => {
              file.url = rs.url
              return rs.fileId
            }}
            uploadIconType={FileDataType.视频}
            showVideoCrop
            on-video-crop={(crop, item) => {
              if (!crop || !crop.data) {
                return
              }
              const file = this.$utils.base64ToFile(crop.data, '截图')
              this.$refs.detailView.$refs.cover.setFile({
                data: crop.data,
                file: file,
                fileType: FileDataType.图片,
              })
            }}
            v-model={this.videoList}
            showProgress
          ></MyUpload>
        </FormItem>
        {this.renderDetailOpBox(detail)}
      </ContentMgtDetail>
    )
  }
}
