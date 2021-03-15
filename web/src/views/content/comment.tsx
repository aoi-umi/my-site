import { Component, Vue, Watch } from 'vue-property-decorator'

import { Prop } from '@/components/property-decorator'
import { testApi } from '@/api'
import { convert } from '@/helpers'
import { convClass, getCompOpts } from '@/components/utils'
import { MyList, IMyList, ResultType } from '@/components/my-list'
import { MyEditor } from '@/components/my-editor'
import { Divider, Button, Avatar, Modal, Icon, Time } from '@/components/iview'
import { MyConfirm } from '@/components/my-confirm'
import { dev, myEnum } from '@/config'
import { Base } from '../base'
import { UserAvatarView } from '../comps/user-avatar'
import { UserPoptipView } from '../comps/user-poptip'

import './comment.less'

class CommentProp {
    @Prop()
    ownerId: string;

    @Prop()
    ownUserId: string;

    @Prop()
    type: number;
}

@Component({
  extends: Base,
  mixins: [getCompOpts(CommentProp)]
})
export class Comment extends Vue<CommentProp & Base> {
    stylePrefix = 'comment-';

    $refs: { list: IMyList<any>, replyList: IMyList<any> };
    mounted () {
      this.query()
      this.$refs.replyList.model.setPage({ size: 3 })
    }

    async query (opt?, noClear?) {
      this.refreshLoading = true
      await this.$refs.list.query(opt)
      this.refreshLoading = false
    }

    async replyQuery (opt?, noClear?) {
      if (this.replyShow) { await this.$refs.replyList.query(opt, noClear) }
    }

    refreshLoading = false;
    submitLoading = false;
    submit () {
      const reply = this.reply.content.trim()
      if (!reply) { return this.$Message.warning('请输入评论') }
      this.operateHandler('发送评论', async () => {
        this.submitLoading = true
        const quote = this.reply.quote || {}
        const topId = quote.topId || quote._id || null
        const rs = await testApi.commentSubmit({
          ownerId: this.ownerId, comment: reply, type: this.type,
          quoteId: quote._id || null,
          topId
        })
        const data = this.$refs.list.result.data
        if (!topId) { data.unshift(rs) } else {
          if (this.currComment) {
            this.$refs.replyList.result.data.unshift(rs)
          } else {
            const top = data.find(ele => ele._id === topId)
            if (top) {
              top.replyList.push(rs)
            }
          }
        }
        this.resetReply()
      }).finally(() => {
        this.submitLoading = false
      })
    }

    delShow = false;
    replyShow = false;
    @Watch('replyShow')
    private watchReplyShow (newVal) {
      if (!newVal) { this.currComment = null }
    }
    currComment;
    delList = [];
    handleDel (ele) {
      this.delList = [ele]
      this.delShow = true
    }

    delClick () {
      return this.operateHandler('删除', async () => {
        await testApi.commentDel({ idList: this.delList.map(ele => ele._id) })
        this.delList.forEach(ele => {
          ele.isDel = true
        })
        this.delList = []
        this.delShow = false
      })
    }

    handleVote (detail, value) {
      this.operateHandler('', async () => {
        const rs = await testApi.voteSubmit({ ownerId: detail._id, value, type: myEnum.voteType.评论 })
        for (const key in rs) {
          detail[key] = rs[key]
        }
        detail.voteValue = value
      }, {
        noSuccessHandler: true
      })
    }

    private reply = {
      floor: -1,
      quote: null,
      content: ''
    };

    private resetReply (comment?) {
      this.reply.content = ''
      this.reply.floor = comment ? comment.floor : -1
      this.reply.quote = comment || null
    }
    renderSubmitBox () {
      return (
        <div class={this.getStyleName('send-box')}>
          <MyEditor
            class={this.getStyleName('send')}
            toolbar={
              [
                ['bold', 'italic', 'underline', 'strike'], // toggled buttons
                [{ 'header': 1 }, { 'header': 2 }], // custom button values
                [{ 'size': ['small', false, 'large', 'huge'] }], // custom dropdown
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                [{ 'color': [] }, { 'background': [] }], // dropdown with defaults from theme
                [{ 'font': [] }],
                ['link']
              ]
            }
            placeholder='请输入评论'
            v-model={this.reply.content}
            defaultOnly
          />
          <div class={this.getStyleName('send-op-box')}>
            <Button on-click={() => {
              this.resetReply()
            }} >取消</Button>
            <Button type='primary' on-click={() => {
              this.submit()
            }} loading={this.submitLoading}>发送评论</Button>
          </div>
        </div>
      )
    }

    renderComment (ele, reply?: boolean) {
      return (
        <div class={this.getStyleName(!reply ? 'main' : 'reply')} key={ele._id}>
          <div class={this.getStyleName('content-root')}>
            {ele.user && <UserAvatarView user={ele.user} isAuthor={ele.user._id === this.ownUserId} />}
            <span class={this.getStyleName('floor')}>
                        #{ele.floor}
            </span>
            <div class={this.getStyleName('content')}>
              {ele.quoteUser &&
                            <div><span>回复</span>
                              <UserPoptipView user={ele.quoteUser}>
                                <b><a>{ele.quoteUser.nickname}</a></b>
                              </UserPoptipView>
                              <b>{ele.quoteUser._id === this.ownUserId && '(作者)'}:</b>
                            </div>
              }
              {ele.isDel
                ? <p class={this.getStyleName('text')}>评论已删除</p>
                : <p domPropsInnerHTML={ele.comment} class={this.getStyleName('text')} />
              }
              <div class={this.getStyleName('bottom')}>
                <span class='not-important' ><Time time={new Date(ele.createdAt)} /></span>
                <div class='flex-stretch'></div>
                <div class={[...this.getStyleName('op-box'), 'pointer']}>
                  {ele.canDel && <Icon type='md-trash' size={20} on-click={() => {
                    this.handleDel(ele)
                  }} />}
                  <span><Icon type='md-thumbs-up' size={20} color={ele.voteValue == myEnum.voteValue.喜欢 ? 'red' : ''} on-click={() => {
                    this.handleVote(ele, ele.voteValue == myEnum.voteValue.喜欢 ? myEnum.voteValue.无 : myEnum.voteValue.喜欢)
                  }} />{ele.like}</span>
                  <Icon type='md-quote' size={20} on-click={() => {
                    this.resetReply(ele)
                  }} />
                </div>
              </div>
            </div>
            {this.reply.quote === ele && this.renderSubmitBox()}
          </div>
          {(ele.replyList && ele.replyList.length > 0) &&
                    <div class={this.getStyleName('reply-list')}>
                      {ele.replyList.map(reply => this.renderComment(reply, true)).concat(
                        <div class={[...this.getStyleName('more-reply'), 'center']}>
                          <a on-click={() => {
                            this.replyShow = true
                            this.currComment = {
                              ...ele,
                              replyList: []
                            }
                            this.$refs.replyList.handleQuery({ resetPage: true })
                          }}>更多</a>
                        </div>)}
                    </div>
          }
          <Divider size='small' />
        </div>
      )
    }

    renderResult (rs: ResultType) {
      return rs.data.map((ele) => {
        return this.renderComment(ele)
      })
    }

    render () {
      const send = this.reply.floor === 0
      return (
        <div>
          <div class={this.getStyleName('send-op-box').concat(['button-group-normal'])}>
            <Button on-click={() => {
              this.query(convert.Test.listModelToQuery(this.$refs.list.model))
            }} loading={this.refreshLoading}>刷新评论</Button>
            <Button type='primary' on-click={() => {
              this.resetReply({ floor: send ? -1 : 0 })
            }}>{send ? '取消发送' : '发送评论'}</Button>
          </div>
          {send && this.renderSubmitBox()}
          <MyList
            ref='list'
            hideSearchBox
            type='custom'
            pagePosition='both'

            customRenderFn={this.renderResult}

            on-query={(t) => {
              this.query(convert.Test.listModelToQuery(t))
            }}

            queryFn={async (data) => {
              const rs = await testApi.commentQuery({
                ...data,
                ownerId: this.ownerId,
                type: this.type
              })
              return rs
            }}
          ></MyList>
          <Modal v-model={this.replyShow} class={this.getStyleName('reply-modal')} footer-hide>
            <h3>更多回复</h3>
            {this.currComment && this.renderComment(this.currComment)}
            <MyList
              ref='replyList'
              hideSearchBox
              type='custom'
              showSizer={false}
              // infiniteScroll

              customRenderFn={this.renderResult}

              on-query={(t, noClear) => {
                this.replyQuery(convert.Test.listModelToQuery(t), noClear)
              }}

              queryFn={async (data) => {
                const rs = await testApi.commentQuery({
                  ...data,
                  ownerId: this.ownerId,
                  type: this.type,
                  topId: this.currComment._id
                })
                // 移除相同key
                rs.rows.forEach(ele => {
                  const idx = this.$refs.replyList.result.data.findIndex(e => e._id === ele._id)
                  if (idx > -1) { this.$refs.replyList.result.data.splice(idx, 1) }
                })
                return rs
              }}
            ></MyList>
          </Modal>
          <Modal v-model={this.delShow} footer-hide>
            <MyConfirm title='确认删除?' loading={true}
              cancel={() => {
                this.delShow = false
              }}
              ok={async () => {
                await this.delClick()
              }}>
                        确认删除?
            </MyConfirm>
          </Modal>
        </div>
      )
    }
}

export const CommentView = convClass<CommentProp>(Comment)
