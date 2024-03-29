import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop } from '@/components/decorator'
import { testApi, testSocket } from '@/api'
import { myEnum, dev } from '@/config'
import { Divider, Spin, Affix, Card } from '@/components/iview'
import { MyLoad } from '@/components/my-load'
import { MyVideo } from '@/components/my-video'
import { FileType, FileDataType } from '@/components/my-upload'
import { MyTag } from '@/components/my-tag'

import { UserAvatar } from '../comps/user-avatar'
import { Base } from '../base'
import { DetailType, DetailDataType } from './video-mgt-detail'
import { Comment } from './comment'
import { ContentOperate } from './content'

import './video.less'

@Component
export default class VideoDetail extends Base {
  stylePrefix = 'video-'
  $refs: { loadView: MyLoad; comment: Comment }

  render() {
    return (
      <MyLoad
        ref="loadView"
        loadFn={async () => {
          const query = this.$route.query
          const rs = await testApi.videoDetailQuery({ _id: query._id })
          this.setTitle(rs.detail.title)
          return rs
        }}
        renderFn={(t: DetailType) => {
          const { detail } = t
          return (
            <div>
              <VideoDetailMain data={detail} />
              <Divider size="small" />
              <Affix offset-bottom={40}>
                <Card>
                  <ContentOperate
                    data={detail}
                    contentType={myEnum.contentType.视频}
                    voteType={myEnum.voteType.视频}
                    on-operate-click={(type) => {
                      if (type === myEnum.contentOperateType.评论) {
                        const el = this.$refs.comment.$el as HTMLElement
                        window.scrollTo(0, el.offsetTop)
                      }
                    }}
                    getShareUrl={() => {
                      return location.href
                    }}
                  />
                </Card>
              </Affix>
              <Comment
                ref="comment"
                ownerId={detail._id}
                ownUserId={detail.userId}
                type={myEnum.contentType.视频}
              />
            </div>
          )
        }}
      />
    )
  }
}

class VideoDetailMainProp {
  @Prop({
    required: true,
  })
  data: DetailDataType

  @Prop()
  mgt?: boolean
}
@Component({
  extends: Base,
  props: VideoDetailMainProp,
})
export class VideoDetailMain extends Vue<VideoDetailMainProp, Base> {
  stylePrefix = 'video-'

  $refs: { video: MyVideo }

  videoId: string

  created() {
    this.videoList = this.data.videoList.map((ele) => {
      return {
        url: ele.url,
        fileType: FileDataType.视频,
        originFileType: ele.contentType,
      }
    })
    this.videoId = this.data.videoIdList[0]
    testSocket.danmakuConnect({ videoId: this.videoId })
    testSocket.bindDanmakuRecv(this.recvDanmaku)
  }

  mounted() {
    this.loadDanmaku()
  }

  destroyed() {
    testSocket.danmakuDisconnect({ videoId: this.videoId })
  }

  videoList: FileType[] = []

  async loadDanmaku() {
    const rs = await testApi.danmakuQuery({ videoId: this.videoId })
    rs.rows.forEach((ele) => {
      ele.isSelf = this.storeUser.user.equalsId(ele.userId)
    })
    this.$refs.video.danmakuPlayer.danmakuPush(rs.rows)
  }

  recvDanmaku(data) {
    if (data.videoId == this.videoId) {
      this.$refs.video.danmakuPlayer.danmakuPush(data, true)
    }
  }

  renderHeader(detail: DetailDataType) {
    return (
      <div>
        <UserAvatar user={detail.user} />
        {['发布于: ' + this.$utils.dateFormat(detail.publishAt)].map((ele) => {
          return (
            <span class="not-important" style={{ marginLeft: '5px' }}>
              {ele}
            </span>
          )
        })}
      </div>
    )
  }

  render() {
    const detail = this.data
    return (
      <div>
        <div class="flex">
          <h1 class="flex-stretch">{detail.title}</h1>
          {this.mgt && <MyTag value={detail.statusText} />}
        </div>
        <br />
        {this.renderHeader(detail)}
        <br />
        <div class={this.getStyleName('video-box')}>
          <MyVideo
            ref="video"
            options={{
              sources: this.videoList.map((ele) => {
                return {
                  src: ele.url,
                  type: ele.originFileType,
                }
              }),
              poster: detail.coverUrl,
              danmaku: {
                enable: true,
                sendFn: async (data) => {
                  const rs = await this.operateHandler(
                    '发送弹幕',
                    async () => {
                      data.videoId = this.videoId
                      await testApi.danmakuSubmit(data)
                    },
                    { noSuccessHandler: true },
                  )
                  return rs.success
                },
              },
            }}
          />
        </div>
        <br />
        <div class="not-important">简介: {detail.profile}</div>
      </div>
    )
  }
}
