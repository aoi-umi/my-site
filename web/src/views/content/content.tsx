import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop } from '@/components/decorator'
import { myEnum, dev } from '@/config'
import { testApi } from '@/api'
import { routerConfig } from '@/router'
import { Icon, Card, Row, Col, Checkbox, Time, Divider, Dropdown, DropdownMenu, DropdownItem } from '@/components/iview'
import { Utils } from '@/components/utils'
import { MyTag } from '@/components/my-tag'

import { Base } from '../base'
import { UserAvatar } from '../comps/user-avatar'
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
  props: ContentOperateProp
})
export class ContentOperate extends Vue<ContentOperateProp, Base> {
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
        type: myEnum.contentOperateType.??????,
        text: ele.readTimes
      }, {
        icon: 'md-text',
        type: myEnum.contentOperateType.??????,
        text: ele.commentCount
      }, {
        icon: 'md-heart',
        type: myEnum.contentOperateType.??????,
        class: 'pointer',
        text: ele.favourite,
        color: ele.favouriteValue ? 'red' : '',
        onClick: () => {
          this.handleFavourite(ele, !ele.favouriteValue)
        }
      }, {
        icon: 'md-thumbs-up',
        type: myEnum.contentOperateType.???,
        class: 'pointer',
        text: ele.like,
        color: ele.voteValue == myEnum.voteValue.?????? ? 'red' : '',
        onClick: () => {
          this.handleVote(ele, ele.voteValue == myEnum.voteValue.?????? ? myEnum.voteValue.??? : myEnum.voteValue.??????)
        }
      }, {
        icon: 'md-thumbs-down',
        type: myEnum.contentOperateType.???,
        class: 'pointer',
        text: ele.dislike,
        color: ele.voteValue == myEnum.voteValue.????????? ? 'red' : '',
        onClick: () => {
          this.handleVote(ele, ele.voteValue == myEnum.voteValue.????????? ? myEnum.voteValue.??? : myEnum.voteValue.?????????)
        }
      }, {
        icon: 'md-share',
        type: myEnum.contentOperateType.??????,
        class: 'pointer',
        onClick: () => {
          const url = this.getShareUrl()
          Utils.copy2Clipboard(url)
          this.$Message.info('?????????????????????')
        }
      }]
    }

    renderBtns () {
      const list = this.getOperationCfg()
      const minOperation = list.filter(cfg => [
        myEnum.contentOperateType.??????,
        myEnum.contentOperateType.??????,
        myEnum.contentOperateType.??????,
        myEnum.contentOperateType.???
      ].includes(cfg.type))

      const otherOperation = list.filter(cfg => [
        myEnum.contentOperateType.???,
        myEnum.contentOperateType.??????
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
        myEnum.contentOperateType.??????,
        myEnum.contentOperateType.??????,
        myEnum.contentOperateType.??????,
        myEnum.contentOperateType.???,
        myEnum.contentOperateType.???
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
  props: ContentListItemProp
})
export class ContentListItem extends Vue<ContentListItemProp, Base> {
    stylePrefix = 'content-';

    private cfgs = {
      [myEnum.contentType.??????]: {
        detailUrl: routerConfig.articleDetail.path,
        profile: dev.defaultArticleProfile,
        voteType: myEnum.voteType.??????
      },
      [myEnum.contentType.??????]: {
        detailUrl: routerConfig.videoDetail.path,
        profile: dev.defaultVideoProfile,
        voteType: myEnum.voteType.??????
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
      const min = false// this.contentType === myEnum.contentType.??????;
      return (
        <div>
          <Card style={{ marginTop: '5px', cursor: this.mgt ? '' : 'pointer' }}>
            <div on-click={() => {
              this.toDetail(ele)
            }}>
              <Row>
                <Col class={this.getStyleName('top-col')} span={24}>
                  <h3 class={[...this.getStyleName('list-title'), 'flex-stretch']} title={ele.title}>{ele.title}</h3>
                  {this.mgt && <MyTag value={ele.statusText} />}
                  {this.selectable && <Checkbox value={ele._checked} disabled={ele._disabled} on-on-change={(checked) => {
                    this.$emit('selected-change', checked)
                  }} />}
                </Col>
                <Col class={this.getStyleName('user-col')} span={24}>
                  <UserAvatar user={ele.user} />
                  {ele.publishAt && <span class='not-important' style={{ marginLeft: '5px' }}>????????? <Time time={new Date(ele.publishAt)} /></span>}
                </Col>
              </Row>
              <Row class={this.getStyleName('content-row')}>
                <Col class={this.getStyleName('cover-col')} span={24}>
                  {ele.coverUrl && <img class={[...this.getStyleName('cover'), 'my-upload-item cover']} v-lazy={ele.coverUrl} />}
                  {!min && <p class={this.getStyleName('profile')}>{ele.profile || this.cfg.profile}</p>}
                </Col>
                {this.mgt && <p class='not-important'>????????? <Time time={new Date(ele.createdAt)} /></p>}
                {this.mgt && <ContentOperate data={ele} contentType={this.contentType} voteType={this.cfg.voteType} mgt />}
              </Row>
              <Divider size='small' />
            </div>
            <div style='display:flex;'>
              {this.$slots.default || (!this.mgt
                ? <ContentOperate data={ele} contentType={this.contentType} voteType={this.cfg.voteType} stretch toDetail={() => {
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
