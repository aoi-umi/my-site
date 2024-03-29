import { Watch } from 'vue-property-decorator'
import marked from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

import { Component, Vue, Prop } from '@/components/decorator'
import { testApi } from '@/api'
import { myEnum, dev } from '@/config'
import { Divider, Affix, Card } from '@/components/iview'
import { MyLoad } from '@/components/my-load'
import { MyTag } from '@/components/my-tag'

import { UserAvatar } from '../comps/user-avatar'
import { Base } from '../base'
import { DetailType, DetailDataType } from './article-mgt-detail'
import { Comment } from './comment'
import { ContentOperate } from './content'

marked.setOptions({
  renderer: new marked.Renderer(),
  highlight: function (code) {
    return hljs.highlightAuto(code).value
  },
  pedantic: false,
  gfm: true,
  // tables: true,
  breaks: false,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  xhtml: false,
})
@Component
export default class ArticleDetail extends Base {
  $refs: { loadView: MyLoad; comment: Comment }

  render() {
    return (
      <MyLoad
        ref="loadView"
        loadFn={async () => {
          const query = this.$route.query
          const rs = await testApi.articleDetailQuery({ _id: query._id })
          this.setTitle(rs.detail.title)
          return rs
        }}
        renderFn={(t: DetailType) => {
          const { detail } = t
          return (
            <div>
              <ArticleDetailMain data={detail} />
              <Affix offset-bottom={40}>
                <Card>
                  <ContentOperate
                    data={detail}
                    contentType={myEnum.contentType.文章}
                    voteType={myEnum.voteType.文章}
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
              <Divider size="small" />
              <Comment
                ref="comment"
                ownerId={detail._id}
                ownUserId={detail.userId}
                type={myEnum.contentType.文章}
              />
            </div>
          )
        }}
      />
    )
  }
}

class ArticleDetailMainProp {
  @Prop({
    required: true,
  })
  data: DetailDataType

  @Prop()
  mgt?: boolean
}
@Component({
  extends: Base,
  props: ArticleDetailMainProp,
})
export class ArticleDetailMain extends Vue<ArticleDetailMainProp, Base> {
  stylePrefix = 'article-'
  content = ''
  created() {
    const detail = this.data
    this.content = detail.content
    if (detail.contentType === myEnum.articleContentType.Markdown) {
      this.content = marked(detail.content)
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
        <div class="ql-snow">
          <div class="ql-editor" domPropsInnerHTML={this.content} />
        </div>
        <br />
        <div class="not-important">简介: {detail.profile}</div>
      </div>
    )
  }
}
