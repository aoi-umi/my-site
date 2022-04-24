import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop } from '@/components/decorator'
import { testApi } from '@/api'
import { convert } from '@/helpers'
import { MyList, ResultType } from '@/components/my-list'
import { MyEditor } from '@/components/my-editor'
import { MyInputBaseProp, MyInputBase } from '@/components/my-input'
import { Divider, Button, Avatar, Modal, Icon, Time } from '@/components/iview'
import { dev, myEnum } from '@/config'
import { routerConfig } from '@/router'

import { Base } from '../base'
import { UserAvatar } from '../comps/user-avatar'
import { UserPoptip } from '../comps/user-poptip'

import './comment.less'

class CommentProp {
  @Prop()
  ownerId: string

  @Prop()
  ownUserId: string

  @Prop()
  type: number
}

@Component({
  extends: Base,
  props: CommentProp,
})
export class Comment extends Vue<CommentProp, Base> {
  stylePrefix = 'comment-'

  $refs: { list: MyList<any>; replyList: MyList<any> }
  mounted() {
    this.query()
    this.$refs.replyList.model.setPage({ size: 3 })
  }

  async query(opt?, noClear?) {
    this.refreshLoading = true
    await this.$refs.list.query(opt)
    this.refreshLoading = false
  }

  async replyQuery(opt?, noClear?) {
    if (this.moreReplyShow) {
      await this.$refs.replyList.query(opt, noClear)
    }
  }

  refreshLoading = false
  submitLoading = false
  submit() {
    const reply = this.getReplyData(this.reply.quote._id).content.trim()
    if (!reply) {
      return this.$Message.warning('请输入评论')
    }
    this.operateHandler('发送评论', async () => {
      this.submitLoading = true
      const quote = this.reply.quote || {}
      const topId = quote.topId || quote._id || null
      const rs = await testApi.commentSubmit({
        ownerId: this.ownerId,
        comment: reply,
        type: this.type,
        quoteId: quote._id || null,
        topId,
      })
      const data = this.$refs.list.result.data
      if (!topId) {
        data.unshift(rs)
      } else {
        if (this.currComment) {
          this.$refs.replyList.result.data.unshift(rs)
        } else {
          const top = data.find((ele) => ele._id === topId)
          if (top) {
            top.replyList.push(rs)
          }
        }
      }
      this.resetReply({ clear: true })
    }).finally(() => {
      this.submitLoading = false
    })
  }

  moreReplyShow = false
  @Watch('moreReplyShow')
  private watchMoreReplyShow(newVal) {
    if (!newVal) {
      this.currComment = null
    }
  }
  currComment

  private newComment = {
    _id: '',
  }
  private reply = {
    quote: null,
    data: {},
  }
  private getReplyData(quoteId) {
    let data = this.reply.data[quoteId]
    if (!data)
      data = this.reply.data[quoteId] = {
        content: '',
      }
    return data
  }

  private resetReply(opt?: { comment?; clear?: boolean }) {
    opt = {
      ...opt,
    }
    let { clear, comment } = opt
    if (clear) {
      if (this.reply.quote) {
        let data = this.getReplyData(this.reply.quote._id)
        data.content = ''
      }
      this.reply.quote = null
    }
    if (comment) {
      this.reply.quote = comment
      this.getReplyData(comment._id)
    } else {
      this.reply.quote = null
    }
  }

  renderComment(ele, reply?: boolean) {
    return (
      <CommentDetail
        value={ele}
        isReply={reply}
        ownUserId={this.ownUserId}
        replyData={this.reply}
        submitLoading={this.submitLoading}
        on-quote-click={(ele) => {
          this.resetReply({ comment: ele })
        }}
        on-submit={() => {
          this.submit()
        }}
        on-cancel={() => {
          this.resetReply()
        }}
      >
        <div>
          {ele.replyList?.length && (
            <div class={[...this.getStyleName('more-reply'), 'center']}>
              <a
                on-click={() => {
                  this.moreReplyShow = true
                  this.currComment = {
                    ...ele,
                    replyList: [],
                  }
                  this.$refs.replyList.handleQuery({ resetPage: true })
                }}
              >
                更多
              </a>
            </div>
          )}
        </div>
      </CommentDetail>
    )
  }

  renderResult(rs: ResultType, reply?: boolean) {
    return rs.data.map((ele) => {
      return this.renderComment(ele, reply)
    })
  }

  renderSubmitBox() {
    let data = this.getReplyData(this.reply.quote._id)
    return (
      <CommentSubmitBox
        v-model={data.content}
        loading={this.submitLoading}
        on-submit={() => {
          this.submit()
        }}
        on-cancel={() => {
          this.resetReply()
        }}
      />
    )
  }

  render() {
    const send = this.reply.quote === this.newComment
    const newData = this.getReplyData(this.newComment._id)
    return (
      <div>
        <div
          class={this.getStyleName('send-op-box').concat([
            'button-group-normal',
          ])}
        >
          <Button
            on-click={() => {
              this.query(convert.Test.listModelToQuery(this.$refs.list.model))
            }}
            loading={this.refreshLoading}
          >
            刷新评论
          </Button>
          {send ? (
            <Button
              type="primary"
              on-click={() => {
                this.resetReply()
              }}
            >
              取消发送
            </Button>
          ) : (
            <Button
              type="primary"
              on-click={() => {
                this.resetReply({ comment: this.newComment })
              }}
            >
              发送评论
            </Button>
          )}
        </div>
        {send && this.renderSubmitBox()}
        <MyList
          ref="list"
          hideSearchBox
          type="custom"
          pagePosition="both"
          customRenderFn={this.renderResult}
          on-query={(t) => {
            this.query(convert.Test.listModelToQuery(t))
          }}
          queryFn={async (data) => {
            const rs = await testApi.commentQuery({
              ...data,
              ownerId: this.ownerId,
              type: this.type,
            })
            return rs
          }}
        ></MyList>
        <Modal
          v-model={this.moreReplyShow}
          class={this.getStyleName('reply-modal')}
          footer-hide
        >
          <h3>更多回复</h3>
          {this.currComment && this.renderComment(this.currComment)}
          <MyList
            ref="replyList"
            hideSearchBox
            type="custom"
            showSizer={false}
            // infiniteScroll

            customRenderFn={(ele) => this.renderResult(ele, true)}
            on-query={(t, noClear) => {
              this.replyQuery(convert.Test.listModelToQuery(t), noClear)
            }}
            queryFn={async (data) => {
              const rs = await testApi.commentQuery({
                ...data,
                ownerId: this.ownerId,
                type: this.type,
                topId: this.currComment._id,
              })
              // 移除相同key
              rs.rows.forEach((ele) => {
                const idx = this.$refs.replyList.result.data.findIndex(
                  (e) => e._id === ele._id,
                )
                if (idx > -1) {
                  this.$refs.replyList.result.data.splice(idx, 1)
                }
              })
              return rs
            }}
          ></MyList>
        </Modal>
      </div>
    )
  }
}

class CommentSubmitBoxProp extends MyInputBaseProp {
  @Prop()
  loading?: boolean
}

@Component({
  extends: MyInputBase,
  props: CommentSubmitBoxProp,
})
class CommentSubmitBox extends Vue<CommentSubmitBoxProp, MyInputBase> {
  stylePrefix = 'comment-'
  render() {
    return (
      <div class={this.getStyleName('send-box')}>
        <MyEditor
          class={this.getStyleName('send')}
          toolbar={[
            ['bold', 'italic', 'underline', 'strike'], // toggled buttons
            [{ header: 1 }, { header: 2 }], // custom button values
            [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            [{ color: [] }, { background: [] }], // dropdown with defaults from theme
            [{ font: [] }],
            ['link'],
          ]}
          placeholder="请输入评论"
          v-model={this.currentValue}
          defaultOnly
        />
        <div
          class={[...this.getStyleName('send-op-box'), 'button-group-normal']}
        >
          <Button
            on-click={() => {
              this.$emit('cancel')
            }}
          >
            取消
          </Button>
          <Button
            type="primary"
            on-click={() => {
              this.$emit('submit')
            }}
            loading={this.loading}
          >
            发送评论
          </Button>
        </div>
      </div>
    )
  }
}
class CommentDetailProp {
  @Prop({
    required: true,
  })
  value: any

  @Prop()
  isReply?: boolean

  @Prop()
  ownUserId?: string

  @Prop()
  queryByUser?: boolean

  @Prop()
  replyData?: any

  @Prop()
  submitLoading?: boolean
}

@Component({
  extends: Base,
  props: CommentDetailProp,
})
export class CommentDetail extends Vue<CommentDetailProp, Base> {
  stylePrefix = 'comment-'

  delList = []
  handleDel(ele) {
    this.delList = [ele]
    this.$utils.confirm('确认删除?', {
      ok: this.delClick,
    })
  }

  delClick() {
    return this.operateHandler('删除', async () => {
      await testApi.commentDel({ idList: this.delList.map((ele) => ele._id) })
      this.delList.forEach((ele) => {
        ele.isDel = true
        ele.canDel = false
      })
      this.delList = []
    })
  }

  handleVote(detail, value) {
    this.operateHandler(
      '',
      async () => {
        const rs = await testApi.voteSubmit({
          ownerId: detail._id,
          value,
          type: myEnum.voteType.评论,
        })
        for (const key in rs) {
          detail[key] = rs[key]
        }
        detail.voteValue = value
      },
      {
        noSuccessHandler: true,
      },
    )
  }

  toOwner(ele) {
    let detailUrl = {
      [this.$enum.contentType.文章]: routerConfig.articleDetail.path,
      [this.$enum.contentType.视频]: routerConfig.videoDetail.path,
    }[ele.type]
    this.goToPage({
      path: detailUrl,
      query: { _id: ele.ownerId },
      hash: String(ele.floor),
    })
  }

  renderCommentContent(ele) {
    return ele.isDel ? (
      <p class={this.getStyleName('text')}>评论已删除</p>
    ) : (
      <p domPropsInnerHTML={ele.comment} class={this.getStyleName('text')} />
    )
  }

  renderComment(ele, reply?: boolean) {
    return (
      <div class={this.getStyleName(!reply ? 'main' : 'reply')} key={ele._id}>
        <div class={this.getStyleName('content-root')}>
          {ele.user && (
            <UserAvatar
              user={ele.user}
              isAuthor={ele.user._id === this.ownUserId}
            />
          )}
          {!reply && ele.owner && (
            <div
              class={[...this.getStyleName('owner'), 'not-important']}
              on-click={() => {
                this.toOwner(ele)
              }}
            >
              <span>在{this.$enum.contentType.getName(ele.type)}</span>
              <span class={this.getStyleName('owner-title')}>
                《{ele.owner.title}》
              </span>
              <span>
                {ele.quote || ele.replyList?.length > 0 ? '回复了' : '评论了'}
              </span>
            </div>
          )}
          {!reply && (
            <span class={this.getStyleName('floor')}>#{ele.mainFloor}</span>
          )}
          <div class={this.getStyleName('content')}>
            {ele.quoteUser && (
              <div>
                <span>回复</span>
                <UserPoptip user={ele.quoteUser}>
                  <b>
                    <a>{ele.quoteUser.nickname}</a>
                  </b>
                </UserPoptip>
                <b>{ele.quoteUser._id === this.ownUserId && '(作者)'}:</b>
              </div>
            )}
            {this.renderCommentContent(ele)}
            <div class={this.getStyleName('bottom')}>
              <span class="not-important">
                <Time time={new Date(ele.createdAt)} />
              </span>
              <div class="flex-stretch"></div>
              <div class={[...this.getStyleName('op-box'), 'pointer']}>
                {ele.canDel && (
                  <Icon
                    type="md-trash"
                    size={20}
                    on-click={() => {
                      this.handleDel(ele)
                    }}
                  />
                )}
                {!ele.isDel && (
                  <span>
                    <Icon
                      type="md-thumbs-up"
                      size={20}
                      color={
                        ele.voteValue == myEnum.voteValue.喜欢 ? 'red' : ''
                      }
                      on-click={() => {
                        this.handleVote(
                          ele,
                          ele.voteValue == myEnum.voteValue.喜欢
                            ? myEnum.voteValue.无
                            : myEnum.voteValue.喜欢,
                        )
                      }}
                    />
                    {ele.like}
                  </span>
                )}
                {!this.queryByUser && (
                  <Icon
                    type="md-quote"
                    size={20}
                    on-click={() => {
                      this.$emit('quote-click', ele)
                    }}
                  />
                )}
              </div>
            </div>
          </div>
          {this.replyData?.quote === ele && (
            <CommentSubmitBox
              v-model={this.replyData.data[this.replyData.quote._id].content}
              loading={this.submitLoading}
              on-submit={() => {
                this.$emit('submit')
              }}
              on-cancel={() => {
                this.$emit('cancel')
              }}
            ></CommentSubmitBox>
          )}
        </div>
        {this.queryByUser
          ? ele.quote && (
              <div class={this.getStyleName('quote')}>
                {this.renderCommentContent(ele.quote)}
              </div>
            )
          : ele.replyList?.length > 0 && (
              <div class={this.getStyleName('reply-list')}>
                {ele.replyList.map((reply) => this.renderComment(reply, true))}
                {this.$slots.default}
              </div>
            )}
        <Divider size="small" />
      </div>
    )
  }

  render() {
    return this.renderComment(this.value, this.isReply)
  }
}
