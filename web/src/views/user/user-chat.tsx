import { Component, Vue, Watch } from 'vue-property-decorator'

import { convClass } from '@/components/utils'
import { Card, Split, Input, Button, Time, Icon } from '@/components/iview'
import { IMyLoad, MyLoad } from '@/components/my-load'
import { randStr } from '@/helpers'
import { testApi, testSocket } from '@/api'
import { Base } from '../base'
import { DetailDataType as UserDetailDataType } from './user-mgt'
import { UserAvatarView } from '../comps/user-avatar'
import { myEnum } from '@/config'
import { MyList, IMyList, ResultType } from '@/components/my-list'
import { routerConfig } from '@/router'

import './user.less'

@Component
class ChatDetail extends Base {
    stylePrefix = 'user-chat-detail-';
    detail: UserDetailDataType = {};
    created () {
      this.selfUserId = this.storeUser.user._id
      testSocket.bindChatRecv((data) => {
        if (data.userId === this.detail._id) {
          this.chat.push(data)
        }
      })
    }

    @Watch('$route')
    route (to, from) {
      this.$refs.loadView.loadData()
    }

    async getUserDetail () {
      const query = this.$route.query
      this.detail = await testApi.userDetailQuery(query._id)
      this.loadChat().then(() => {
        this.scrollBottom()
      })
      return this.detail
    }

    private loading = false;
    loadChat () {
      this.loading = true
      return this.operateHandler('获取私信', async () => {
        const rs = await testApi.chatQuery({
          destUserId: this.detail._id,
          lastId: this.lastId,
          rows: 10
        })
        this.chat = [
          ...rs.rows,
          ...this.chat
        ]
        if (this.chat.length > 0) { this.lastId = this.chat[0]._id }
        this.noMore = rs.total == rs.rows.length
      }, { noDefaultHandler: true }).then(rs => {
        this.loading = false
      })
    }

    $refs: {
        loadView: IMyLoad,
        chat: HTMLElement,
        input: HTMLElement
    };

    private split = 0.8;
    private chatContent = '';
    private noMore = false;
    private lastId = null;
    private selfUserId = '';
    chat = [];
    @Watch('chat')
    private watchChat () {
      const elm = this.$refs.chat
      if (elm.scrollTop + elm.clientHeight == elm.scrollHeight) {
        this.$nextTick(() => {
          this.scrollBottom()
        })
      }
    }

    async chatSubmit (retryData?) {
      let data: any, pushData: any
      if (!retryData) {
        data = {
          destUserId: this.detail._id,
          content: this.chatContent
        }
        pushData = {
          ...data,
          userId: this.storeUser.user._id,
          createdAt: new Date(),
          key: randStr()
        }
      } else {
        data = {
          destUserId: retryData.destUserId,
          content: retryData.content
        }
        pushData = retryData
      }
      pushData.sendStatus = myEnum.chatSendStatus.发送中
      return this.operateHandler('', async () => {
        if (!retryData) { this.chat.push(pushData) }
        this.chatContent = ''
        await testApi.chatSubmit(data)
      }, { noDefaultHandler: true }).then(rs => {
        if (rs.success) {
          pushData.sendStatus = myEnum.chatSendStatus.发送成功
        } else {
          pushData.sendStatus = myEnum.chatSendStatus.发送失败
        }
        const idx = this.chat.findIndex(ele => ele.key === pushData.key)
        this.chat.splice(idx, 1, pushData)
        this.scrollBottom()
      })
    }

    scrollLoad () {
      if (!this.noMore && !this.loading) {
        this.loadChat()
      }
    }

    scrollBottom () {
      const elm = this.$refs.chat
      elm.scrollTop = elm.scrollHeight
    }

    render () {
      return (
        <div>
          <MyLoad
            ref='loadView'
            loadFn={this.getUserDetail}
            renderFn={() => {
              return (
                <Card>
                  <div slot='title'>
                    <UserAvatarView user={this.detail} />
                  </div>
                  <Split v-model={this.split} mode='vertical' class={this.getStyleName('main')}>
                    <div ref='chat' slot='top' class={this.getStyleName('msg-box')} on-scroll={(e) => {
                      if (e.target.scrollTop === 0) { this.scrollLoad() }
                    }}>
                      {this.loading ? <Icon type='ios-loading' size={18} class='loading-icon' />
                        : this.noMore ? <p class={this.getStyleName('msg-no-more')}>没有更多消息了</p> : <a on-click={() => {
                          this.loadChat()
                        }}>加载更多</a>
                      }
                      {this.chat.length === 0 ? <p>暂无消息</p> : this.chat.map(ele => {
                        const self = ele.userId === this.selfUserId
                        return (
                          <div
                            key={ele._id}
                            class={this.getStyleName('msg-item', self && 'msg-item-self')}>
                            <div class={this.getStyleName('msg-send-status-box')}>
                              {ele.sendStatus === myEnum.chatSendStatus.发送中 && <Icon type='ios-loading' size={18} class='loading-icon' />}
                              {ele.sendStatus === myEnum.chatSendStatus.发送失败 &&
                                                            <Icon class='pointer' type='ios-refresh-circle' size={18} on-click={() => {
                                                              this.chatSubmit(ele)
                                                            }}></Icon>
                              }
                              <div class={this.getStyleName('msg-content')}>
                                {ele.content}
                              </div>
                            </div>
                            <Time class={[...this.getStyleName('msg-send-time'), 'not-important']} time={new Date(ele.createdAt)} />
                          </div>
                        )
                      })}
                    </div>
                    <div slot='bottom' class={this.getStyleName('send-box')}>
                      <textarea
                        ref='input'
                        autofocus
                        v-model={this.chatContent}
                        class={this.getStyleName('send-input')}
                        on-keydown={(e: KeyboardEvent) => {
                          if (this.$utils.isPressEnter(e)) {
                            if (!e.altKey) {
                              this.chatSubmit()
                              e.preventDefault()
                            } else {
                              this.chatContent += '\n'
                            }
                          }
                        }} />
                    </div>
                  </Split>
                  <div class={this.getStyleName('send-btn-box')} >
                    <span class={[...this.getStyleName('send-notice'), 'not-important']}>Alt + Enter换行</span>
                    <Button type='primary' on-click={() => {
                      this.chatSubmit()
                    }}>发送</Button>
                  </div>
                </Card>
              )
            }} />
        </div >
      )
    }
}

const ChatDetailView = convClass(ChatDetail)
export default ChatDetailView

@Component
export class ChatList extends Base {
    stylePrefix = 'user-chat-list-';
    $refs: { list: IMyList };

    query () {
      this.$refs.list.handleQuery({ resetPage: true })
    }

    private async chatListFn (data) {
      const rs = await testApi.chatList(data)
      return rs
    }

    private toChat (userId) {
      this.$router.push({
        path: routerConfig.userChat.path,
        query: { _id: userId }
      })
    }

    private renderChat (rs: ResultType) {
      return rs.data.map(ele => {
        const user = ele.user
        return (
          <Card class={[...this.getStyleName('item'), 'pointer']} nativeOn-click={() => {
            this.toChat(user._id)
          }}>
            <div class={this.getStyleName('item-first-row')}>
              <UserAvatarView user={user} />
              <div class='flex-stretch' />
              <Time class='not-important' time={ele.createdAt} />
            </div>
            <div class='pointer'>
              <span class={this.getStyleName('item-msg')}>{ele.content}</span>
            </div>
          </Card>
        )
      })
    }

    render () {
      return (
        <MyList
          ref='list'
          type='custom'
          hideSearchBox
          on-query={(t, noClear, list: IMyList) => {
            list.query()
          }}

          queryFn={this.chatListFn}

          customRenderFn={(rs) => {
            return this.renderChat(rs)
          }}
        />
      )
    }
}

export const ChatListView = convClass(ChatList)
