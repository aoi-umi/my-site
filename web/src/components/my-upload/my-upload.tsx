import { Watch } from 'vue-property-decorator'
import axios, { AxiosRequestConfig } from 'axios'
import { VueCropper } from 'vue-cropper'

import { Component, Vue, Prop } from '@/components/decorator'

import { Upload, Icon, Progress, Button } from '../iview'
import { Utils, Md5FileResult } from '../utils'
import { MyImg } from '../my-img'
import { MyImgViewer } from '../my-img-viewer'
import { MyBase } from '../my-base'
import { MyVideo } from '../my-video'

import * as style from '../style'

export const FileDataType = {
  未知: '',
  图片: 'image',
  视频: 'video',
}

export type FileType = {
  name?: string
  url?: string
  percentage?: number
  status?: string
  // showProgress?: boolean;
  metadata?: any

  file?: File
  originFileType?: string
  fileType?: any
  data?: string
  originData?: string
  willUpload?: boolean
  uploadRes?: any
}

type UploadOption = {
  file: FileType
}

type CropperOption = {
  img?: any
  autoCrop?: boolean
  autoCropWidth?: number
  autoCropHeight?: number
  fixed?: boolean
  fixedNumber?: [number, number]
  outputType?: 'jpeg' | 'png' | 'webp'
}

type SetFileType = {
  data: string
  fileType: string
  file: File
  originFileType?: string
}
class MyUploadProp {
  @Prop()
  readonly?: boolean

  @Prop()
  uploadCheckUrl?: string

  @Prop()
  uploadUrl?: string

  @Prop({
    default: () => [],
  })
  format?: string[]

  @Prop({
    default: 1024 * 5,
  })
  maxSize?: number

  @Prop({
    default: 1,
  })
  maxCount?: number

  @Prop({
    default: 60,
  })
  width?: number

  @Prop({
    default: 60,
  })
  height?: number

  @Prop()
  headers?: () => any

  @Prop({
    default: 'square',
  })
  shape?: 'circle' | 'square'

  @Prop({
    default: () => [],
  })
  value?: FileType[]

  @Prop({
    default: FileDataType.图片,
  })
  uploadIconType?: string

  @Prop()
  resHandler?: (res: any) => any

  @Prop()
  successHandler?: (res: any, file: FileType) => any

  @Prop()
  cropperOptions?: CropperOption

  @Prop()
  showVideoCrop?: boolean

  @Prop()
  showProgress?: boolean

  @Prop()
  uploadByChunks?: boolean
}
@Component({
  extends: MyBase,
  props: MyUploadProp,
  components: { VueCropper },
  model: {
    prop: 'value',
    event: 'change',
  },
})
export class MyUpload extends Vue<MyUploadProp, MyBase> {
  stylePrefix = 'my-upload-'

  fileList: FileType[] = []

  protected disableEmitChange = false
  @Watch('value', { immediate: true })
  private watchValue(val: any[]) {
    if (this.fileList === val) {
      this.disableEmitChange = true
      return
    }
    if (val) {
      let fileList =
        this.maxCount > 0 && val.length > this.maxCount
          ? val.slice(0, this.maxCount)
          : val
      this.setFile(fileList, { willUpload: false })
    } else {
      this.fileList = []
    }
  }

  @Watch('fileList', { immediate: true })
  private watchFileList() {
    if (this.disableEmitChange) {
      this.disableEmitChange = false
      return
    }
    this.$emit('change', this.fileList)
  }

  $refs: {
    upload: iView.Upload & {
      fileList: FileType[]
      handleClick: () => any
    }
    cropper: any
    imgViewer: MyImgViewer
  }

  defaultList = []

  private showUrl = ''
  private uploadHeaders = {}
  private cropperShow = false
  private editIndex = -1
  private selectedIndex = -1
  private file: File = null
  private fileType = FileDataType.未知
  private cropper: CropperOption = {
    img: '',
    autoCrop: true,
    autoCropWidth: 512,
    autoCropHeight: 288,
    fixed: true,
    fixedNumber: [16, 9],
    outputType: 'png',
  }
  private getFileCount() {
    return this.fileList.length
  }

  private getHideUpload() {
    return this.maxCount > 0 && this.getFileCount() >= this.maxCount
  }

  protected created() {
    if (this.cropperOptions) {
      this.cropper = {
        ...this.cropper,
        ...this.cropperOptions,
      }
    }
  }

  protected mounted() {}

  private handleEdit(file: FileType) {
    this.editIndex = this.fileList.indexOf(file)
    this.file = file.file
    this.cropperShow = true
    this.cropper.img = file.originData
  }

  private handleSelectFile(file: FileType) {
    this.$refs.upload.handleClick()
    this.selectedIndex = this.fileList.indexOf(file)
  }

  private handleView(file: FileType) {
    this.showUrl = file.url || file.data
    this.$refs.imgViewer.show()
  }

  private handleRemove(file: FileType) {
    this.fileList.splice(this.fileList.indexOf(file), 1)
  }

  private async request(opt: AxiosRequestConfig) {
    const headers = this.headers && this.headers()
    const rs = await axios.request({
      headers,
      ...opt,
    })
    let res = this.resHandler ? this.resHandler(rs.data) : rs.data
    return res
  }

  async upload() {
    const errorList = []
    for (let idx = 0; idx < this.fileList.length; idx++) {
      const file = this.fileList[idx]
      if (file.willUpload) {
        try {
          let rs = await this.uploadToServer({ file })
          if (!rs) throw new Error('fail')
          file.uploadRes = this.successHandler
            ? this.successHandler(rs, file)
            : rs
          file.willUpload = false
        } catch (e) {
          errorList.push(`[文件${idx + 1}]:${e.message}`)
        }
      }
    }
    return errorList
  }

  private async uploadToServer(opt: UploadOption) {
    let rs
    if (!this.uploadByChunks) {
      rs = await this.uploadToServerNormal(opt)
    } else {
      let checkRs = await this.uploadCheck(opt)
      rs = checkRs.checkResult.fileObj
      if (!rs)
        rs = await this.uploadToServerByChunks({
          ...opt,
          md5Result: checkRs.md5Result,
          requiredChunks: checkRs.checkResult.requiredChunks,
        })
    }
    return rs
  }

  private async uploadCheck(
    opt: UploadOption & {
      md5Result?: Md5FileResult
    },
  ) {
    let { file, md5Result } = opt
    if (!md5Result) md5Result = await Utils.md5File(file.file)
    const rs = await this.request({
      method: 'post',
      url: this.uploadCheckUrl,
      data: {
        hash: md5Result.hash,
        fileSize: file.file.size,
        contentType: file.file.type,
        filename: file.file.name,
        chunkSize: md5Result.chunkSize,
      },
    })
    return {
      md5Result,
      checkResult: rs,
    }
  }

  private async uploadToServerNormal(opt: UploadOption) {
    let { file } = opt
    const formData = new FormData()
    const uploadFile = Utils.base64ToFile(file.data, file.file.name)
    formData.append('fileName', file.file.name)
    formData.append('file', uploadFile)
    file.percentage = 0
    const rs = await this.request({
      method: 'post',
      url: this.uploadUrl,
      data: formData,
      onUploadProgress: (progress) => {
        file.percentage = Math.round((progress.loaded / progress.total) * 100)
      },
    })
    return rs
  }

  private async uploadToServerByChunks(
    opt: UploadOption & {
      md5Result: Md5FileResult
      requiredChunks: any[]
    },
  ) {
    let { file, md5Result } = opt
    file.percentage = 0
    let requiredChunks = md5Result.chunks
    let successCount = md5Result.chunks.length - requiredChunks.length
    for (let chunk of requiredChunks) {
      const formData = new FormData()
      formData.append('file', new Blob([chunk.data]))
      formData.append('chunkIndex', chunk.index.toString())
      formData.append('hash', md5Result.hash)
      const rs = await this.request({
        method: 'post',
        url: this.uploadUrl,
        data: formData,
      })
      successCount++
      file.percentage = Math.round(
        (successCount / md5Result.chunks.length) * 100,
      )
    }

    let checkRs = await this.uploadCheck(opt)
    return checkRs.checkResult.fileObj
  }

  private checkFormat(file: File) {
    // check format
    if (this.format.length) {
      const fileFormat = file.name.split('.').pop().toLocaleLowerCase()
      const checked = this.format.some(
        (item) => item.toLocaleLowerCase() === fileFormat,
      )
      if (!checked) {
        this.handleFormatError(file, this.fileList)
        return false
      }
    }
    return true
  }

  private handleFormatError(file: File, fileList: FileType[]) {
    this.$Notice.warning({
      title: '文件格式不正确',
      desc: `文件 "${file.name}" 的格式不正确, 只能上传${this.format.join(
        ',',
      )}格式的文件`,
    })
  }

  private checkSize(file: File, checkData?: string) {
    let size = file.size
    if (checkData) {
      checkData = checkData.split(',')[1]
      checkData = checkData.split('=')[0]
      const strLength = checkData.length
      size = parseInt((strLength - (strLength / 8) * 2) as any)
    }
    // check maxSize
    if (this.maxSize) {
      if (size > this.maxSize * 1024) {
        this.handleMaxSize(file, this.fileList)
        return false
      }
    }
    return true
  }

  private handleMaxSize(file: File, fileList: FileType[]) {
    this.$Notice.warning({
      title: '文件大小超出限制',
      desc: `文件 "${file.name}" 大小超出限制(${(this.maxSize / 1024).toFixed(
        2,
      )}M)`,
    })
  }

  private setCurrFile(file: File) {
    this.file = file
    if (file) {
      if (file.type.includes('image/')) {
        this.fileType = FileDataType.图片
      } else if (file.type.includes('video/')) {
        this.fileType = FileDataType.视频
      }
    }
  }
  private handleBeforeUpload(file: File) {
    const rs = this.checkFormat(file)
    if (!rs) {
      return false
    }
    this.setCurrFile(file)

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const fileData = (e.target as any).result
      if (this.fileType === FileDataType.图片) {
        this.cropper.img = fileData
        this.cropperShow = true
      } else {
        this.pushFile(fileData)
      }
    }
    return false
  }

  private getDefaultFileData() {
    return {
      status: 'finished',
      willUpload: true,
      percentage: 0,
    }
  }

  setFile(data: SetFileType | SetFileType[], option?) {
    const list = data instanceof Array ? data : [data]
    this.fileList = list.map((ele) => {
      return {
        ...ele,
        originData: ele.data,
        ...this.getDefaultFileData(),
        ...option,
      }
    })
    if (this.fileList.length) {
      this.setCurrFile(this.fileList[0].file)
    }
  }

  private pushFile(data, originData?) {
    const file = {
      data: data,
      originData: originData || data,
      file: this.file,
      fileType: this.fileType,
      originFileType: this.file.type,
      ...this.getDefaultFileData(),
    }
    const rs = this.checkSize(this.file, data)
    if (!rs) {
      return false
    }
    if (this.editIndex >= 0) {
      this.fileList.splice(this.editIndex, 1, file)
    } else if (this.selectedIndex >= 0) {
      this.fileList.splice(this.selectedIndex, 1, file)
    } else {
      this.fileList.push(file)
    }

    this.cropperShow = false
  }

  protected render() {
    const width = this.width + 'px'
    const height = this.height + 'px'
    let cropperSize = { width: '1024px', height: '576px' }
    if (window.innerWidth < 1024) {
      cropperSize = {
        width: window.innerWidth + 'px',
        height: window.innerHeight - 200 + 'px',
      }
    }
    const coverHeight = '50px' || height
    return (
      <div class={this.getStyleName('item-parent')}>
        {this.fileList.map((item, idx) => {
          const isImg = item.fileType === FileDataType.图片
          const isVideo = item.fileType === FileDataType.视频
          const itemRefName = 'itemRef' + idx
          return (
            <div class={this.getStyleName('item-root')}>
              <div
                class={{
                  ...this.getStyleName('item'),
                  [style.cls.circle]: this.shape == 'circle',
                  move: this.fileList.length > 1,
                }}
                style={{ width, height }}
                v-dragging={{ item, list: this.fileList, group: 'upload-item' }}
                key={idx}
              >
                {isImg && (
                  <MyImg
                    ref={itemRefName}
                    class={this.getStyleName('item-cont')}
                    src={item.url || item.data}
                  />
                )}
                {isVideo && (
                  <MyVideo
                    ref={itemRefName}
                    class={this.getStyleName('item-cont')}
                    options={{
                      sources: [
                        {
                          type: item.originFileType,
                          src: item.url || item.data,
                        },
                      ],
                    }}
                  />
                )}
                {!this.readonly && (
                  <div
                    class={this.getStyleName('item-cover')}
                    style={{ lineHeight: coverHeight }}
                  >
                    {isImg && item.originData && (
                      <Icon
                        type="md-create"
                        nativeOn-click={() => {
                          this.handleEdit(item)
                        }}
                      />
                    )}
                    <Icon
                      type="md-camera"
                      nativeOn-click={() => {
                        this.handleSelectFile(item)
                      }}
                    />
                    {isImg && (
                      <Icon
                        type="md-eye"
                        nativeOn-click={() => {
                          this.handleView(item)
                        }}
                      />
                    )}
                    <Icon
                      type="md-trash"
                      nativeOn-click={() => {
                        this.handleRemove(item)
                      }}
                    />
                    {isVideo && this.showVideoCrop && (
                      <Icon
                        type="md-crop"
                        nativeOn-click={() => {
                          const ref: MyVideo = this.$refs[itemRefName]
                          let data = null
                          if (ref) {
                            data = ref.capture()
                          }
                          this.$emit('video-crop', data, item)
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
              {this.showProgress && (
                <div class={this.getStyleName('progress')}>
                  <Progress
                    style={{ width }}
                    percent={item.percentage}
                    stroke-width={5}
                    hide-info
                  />
                </div>
              )}
            </div>
          )
        })}

        <Upload
          class={this.getStyleName('upload')}
          v-show={!this.getHideUpload()}
          ref="upload"
          show-upload-list={false}
          format={this.format}
          accept={this.format.map((ele) => `.${ele}`).join(',')}
          max-size={this.maxSize}
          // props={{
          //     onSuccess: this.handleSuccess,
          //     onFormatError: this.handleFormatError,
          //     onExceededSize: this.handleMaxSize,
          //     onError: this.handleError
          // }}
          before-upload={this.handleBeforeUpload}
          headers={this.uploadHeaders}
          multiple={false}
          type="drag"
          action={this.uploadUrl}
          style={{ width }}
          nativeOn-click={() => {
            this.selectedIndex = -1
          }}
        >
          <div
            style={{ width, height, lineHeight: height }}
            on-click={() => {
              if (this.headers) {
                this.uploadHeaders = this.headers()
              }
            }}
          >
            <Icon
              type={
                {
                  [FileDataType.图片]: 'md-camera',
                  [FileDataType.视频]: 'logo-youtube',
                }[this.uploadIconType]
              }
              size="20"
            ></Icon>
          </div>
        </Upload>
        <transition name="fade">
          <div class={[style.cls.mask]} v-show={this.cropperShow}>
            <div class={this.getStyleName('cropper-root')}>
              <div
                class={this.getStyleName('cropper-cont')}
                style={{ ...cropperSize }}
              >
                <VueCropper
                  ref="cropper"
                  props={this.cropper}
                  class={
                    this.shape == 'circle'
                      ? this.getStyleName('cropper-circle')
                      : ''
                  }
                />
              </div>
              <div class="button-group-normal">
                <Button
                  on-click={() => {
                    this.cropperShow = false
                  }}
                >
                  取消
                </Button>
                <Button
                  type="primary"
                  on-click={() => {
                    this.$refs.cropper.getCropData((data) => {
                      this.pushFile(data, this.cropper.img)
                    })
                  }}
                >
                  截取
                </Button>
                <Button
                  on-click={() => {
                    this.pushFile(this.cropper.img)
                  }}
                >
                  原图
                </Button>
              </div>
            </div>
          </div>
        </transition>
        <MyImgViewer ref="imgViewer" src={this.showUrl} />
      </div>
    )
  }
}
