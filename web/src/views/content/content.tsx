import { Component, Vue, Watch } from 'vue-property-decorator'

import { Prop } from '@/components/property-decorator'
import { myEnum, dev } from '@/config'
import { testApi } from '@/api'
import { routerConfig } from '@/router'
import { Icon, Card, Row, Col, Checkbox, Time, Divider, Dropdown, DropdownMenu, DropdownItem } from '@/components/iview'
import { convClass, getCompOpts, Utils } from '@/components/utils'
import { MyTag } from '@/components/my-tag'

import { Base } from '../base'
import { UserAvatarView } from '../comps/user-avatar'
import { ContentDataType } from './content-mgt-base'

import './content.less'

class ContentOperateProp {
    @Prop({
      required: true
    })
    data: ContentDataType;

    @Prop({
      required: true
    })
    voteType: number;

    @Prop({
      required: true
    })
    contentType: number;

    @Prop()
    stretch?: boolean;

    @Prop()
    mgt?: boolean;

    @Prop()
    toDetail?: () => void;

    @Prop()
    getShareUrl?: () => void;
}
@Component({
  extends: Base,
  mixins: [getCompOpts(ContentOperateProp)]
})
class ContentOperate extends Vue<ContentOperateProp & Base> {
    stylePrefix = 'content-op-'

    private handleVote (detail, value) {
      this.operateHandler('', async () => {
        const rs = await testApi.voteSubmit({ ownerId: detail._id, value, type: this.voteType })
        for (const key in rs) {
          detail[key] = rs[key]
        }
        detail.voteValue = value
      }, {
        noSuccessHandler: true
      })
    }

    private handleFavourite (detail, favourite) {
      this.operateHandler('', async () => {
        const rs = await testApi.favouriteSubmit({ ownerId: detail._id, favourite, type: this.voteType })
        for (const key in rs) {
          detail[key] = rs[key]
        }
        detail.favouriteValue = favourite
      }, {
        noSuccessHandler: true
      })
    }

    render () {
      return (
        <div class={[this.getStyleName('main'), this.stretch && this.getStyleName('stretch'), this.mgt && 'not-important']}>
          {!this.mgt ? this.renderBtns() : this.renderMgtBtns()}
        </div>
      )
    }

    getOperationCfg () {
      const ele = this.data
      return [{
        icon: 'md-eye',
        type: myEnum.contentOperateType.查看,
        text: ele.readTimes
      }, {
        icon: 'md-text',
        type: myEnum.contentOperateType.评论,
        text: ele.commentCount
      }, {
        icon: 'md-heart',
        type: myEnum.contentOperateType.收藏,
        class: 'pointer',
        text: ele.favourite,
        color: ele.favouriteValue ? 'red' : '',
        onClick: () => {
          this.handleFavourite(ele, !ele.favouriteValue)
        }
      }, {
        icon: 'md-thumbs-up',
        type: myEnum.contentOperateType.赞,
        class: 'pointer',
        text: ele.like,
        color: ele.voteValue == myEnum.voteValue.喜欢 ? 'red' : '',
        onClick: () => {
          this.handleVote(ele, ele.voteValue == myEnum.voteValue.喜欢 ? myEnum.voteValue.无 : myEnum.voteValue.喜欢)
        }
      }, {
        icon: 'md-thumbs-down',
        type: myEnum.contentOperateType.踩,
        class: 'pointer',
        text: ele.dislike,
        color: ele.voteValue == myEnum.voteValue.不喜欢 ? 'red' : '',
        onClick: () => {
          this.handleVote(ele, ele.voteValue == myEnum.voteValue.不喜欢 ? myEnum.voteValue.无 : myEnum.voteValue.不喜欢)
        }
      }, {
        icon: 'md-share',
        type: myEnum.contentOperateType.分享,
        class: 'pointer',
        onClick: () => {
          const url = this.getShareUrl()
          Utils.copy2Clipboard(url)
          this.$Message.info('已复制到粘贴板')
        }
      }]
    }

    renderBtns () {
      const list = this.getOperationCfg()
      const minOperation = list.filter(cfg => [
        myEnum.contentOperateType.查看,
        myEnum.contentOperateType.评论,
        myEnum.contentOperateType.收藏,
        myEnum.contentOperateType.赞
      ].includes(cfg.type))

      const otherOperation = list.filter(cfg => [
        myEnum.contentOperateType.踩,
        myEnum.contentOperateType.分享
      ].includes(cfg.type))

      if (this.isSmall) {
        return [
          ...minOperation.map(iconEle => {
            return this.renderBtn(iconEle)
          }),
          <div class={['center', this.getStyleName('item')]}>
            <Dropdown>
              <Icon type='md-more' size={24} />
              <DropdownMenu slot='list'>
                {otherOperation.map(iconEle => {
                  return (
                    <DropdownItem>
                      {this.renderBtn(iconEle)}
                    </DropdownItem>
                  )
                })}
              </DropdownMenu>
            </Dropdown>
          </div>
        ]
      } else {
        return list.map(iconEle => {
          return this.renderBtn(iconEle)
        })
      }
    }

    renderMgtBtns () {
      const list = this.getOperationCfg().filter(cfg => [
        myEnum.contentOperateType.查看,
        myEnum.contentOperateType.评论,
        myEnum.contentOperateType.收藏,
        myEnum.contentOperateType.赞,
        myEnum.contentOperateType.踩
      ].includes(cfg.type))
      return list.map(iconEle => {
        return this.renderBtn(iconEle)
      })
    }

    renderBtn (iconEle: {
        icon: string;
        type: number;
        text?: string | number;
        class?: string;
        onClick?: () => void;
        color?: string;
    }) {
      return (
        <div class={[this.getStyleName('item'), ...(!this.mgt ? [iconEle.class, 'center'] : [])]}
          on-click={this.mgt ? () => { } : (iconEle.onClick || (() => {
            this.toDetail && this.toDetail()
            this.$emit('operate-click', iconEle.type)
          }))} >
          <Icon
            type={iconEle.icon}
            size={!this.mgt ? 24 : 20}
            color={iconEle.color} />
          <b style={{ marginLeft: '4px' }}>{iconEle.text}</b>
        </div>
      )
    }
}

export const ContentOperateView = convClass<ContentOperateProp>(ContentOperate)

class ContentListItemProp {
    @Prop({
      required: true
    })
    value: ContentDataType;

    @Prop({
      default: false
    })
    selectable?: boolean;

    @Prop()
    mgt?: boolean;

    @Prop({
      required: true
    })
    contentType: number;
}

@Component({
  extends: Base,
  mixins: [getCompOpts(ContentListItemProp)]
})
class ContentListItem extends Vue<ContentListItemProp & Base> {
    stylePrefix = 'content-';

    private cfgs = {
      [myEnum.contentType.文章]: {
        detailUrl: routerConfig.articleDetail.path,
        profile: dev.defaultArticleProfile,
        voteType: myEnum.voteType.文章
      },
      [myEnum.contentType.视频]: {
        detailUrl: routerConfig.videoDetail.path,
        profile: dev.defaultVideoProfile,
        voteType: myEnum.voteType.视频
      }
    };
    private cfg = this.cfgs[this.contentType];

    private toDetail (ele: ContentDataType) {
      if (this.mgt) {
        return
      }
      this.$router.push({
        path: this.cfg.detailUrl,
        query: { _id: ele._id }
      })
    }

    private getDetailUrl (ele: ContentDataType) {
      return `${location.host}${this.cfg.detailUrl}?_id=${ele._id}`
    }

    render () {
      const ele = this.value
      const min = false// this.contentType === myEnum.contentType.视频;
      return (
        <div>
          <Card style={{ marginTop: '5px', cursor: this.mgt ? '' : 'pointer' }}>
            <div on-click={() => {
              this.toDetail(ele)
            }}>
              <Row>
                <Col class={this.getStyleName('top-col')} >
                  <h3 class={[...this.getStyleName('list-title'), 'flex-stretch']} title={ele.title}>{ele.title}</h3>
                  {this.mgt && <MyTag value={ele.statusText} />}
                  {this.selectable && <Checkbox value={ele._checked} disabled={ele._disabled} on-on-change={(checked) => {
                    this.$emit('selected-change', checked)
                  }} />}
                </Col>
                <Col class={this.getStyleName('user-col')}>
                  <UserAvatarView user={ele.user} />
                  {ele.publishAt && <span class='not-important' style={{ marginLeft: '5px' }}>发布于 <Time time={new Date(ele.publishAt)} /></span>}
                </Col>
              </Row>
              <Row class={this.getStyleName('content-row')}>
                <Col class={this.getStyleName('cover-col')}>
                  {ele.coverUrl && <img class={[...this.getStyleName('cover'), 'my-upload-item cover']} v-lazy={ele.coverUrl} />}
                  {!min && <p class={this.getStyleName('profile')}>{ele.profile || this.cfg.profile}</p>}
                </Col>
                {this.mgt && <p class='not-important'>创建于 <Time time={new Date(ele.createdAt)} /></p>}
                {this.mgt && <ContentOperateView data={ele} contentType={this.contentType} voteType={this.cfg.voteType} mgt />}
              </Row>
              <Divider size='small' />
            </div>
            <div style='display:flex;'>
              {this.$slots.default || (!this.mgt
                ? <ContentOperateView data={ele} contentType={this.contentType} voteType={this.cfg.voteType} stretch toDetail={() => {
                  this.toDetail(ele)
                }} getShareUrl={() => {
                  return this.getDetailUrl(ele)
                }} />
                : <div />)}
            </div>
          </Card>
        </div>
      )
    }
}

export const ContentListItemView = convClass<ContentListItemProp>(ContentListItem)
