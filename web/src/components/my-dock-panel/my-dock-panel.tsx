import { Component, Vue, Watch } from 'vue-property-decorator'
import { VNode } from 'vue'

import { Prop } from '@/components/property-decorator'
import { Button, Row, Col, Modal } from '../iview'
import { convClass, getCompOpts, getInstCompName } from '../utils'
import { MyBase } from '../my-base'

import './style.less'

class MyDockPanelProp {
}
@Component({
  name: 'MyDockPanel',
  extends: MyBase,
  mixins: [getCompOpts(MyDockPanelProp)]
})
class MyDockPanelModel extends Vue<MyDockPanelProp & MyBase> {
  stylePrefix = 'my-dock-panel-';

  getDock (ele) {
    let propsData = ele.componentOptions.propsData
    let dock = propsData.dock || 'top'
    let direction = ['left', 'right'].includes(dock) ? 'row' : 'column'
    return {
      dock,
      direction,
      propsData
    }
  }

  get items () {
    return this.$slots.default.filter(ele => {
      return getInstCompName(ele) === 'MyDockPanelItem'
    })
  }

  render () {
    let newItem
    let items = this.items
    for (let idx = items.length - 1; idx >= 0; idx--) {
      let ele = items[idx]
      let lIdx = items.length - 1 - idx
      let { direction, dock } = this.getDock(ele)
      let style = ''
      if (idx === 0) { style = 'width:100%;height:100%' }
      newItem = (
        <div class={this.getStyleName('container', 'stretch', direction)} style={style}>
          {['bottom', 'right'].includes(dock) && newItem}
          {ele}
          {['left', 'top'].includes(dock) && newItem}
        </div>)
    }
    return (
      <div>
        {newItem}
      </div>
    )
  }
}

export const MyDockPanel = convClass<MyDockPanelProp>(MyDockPanelModel)

class MyDockPanelItemProp {
  @Prop()
  dock?: 'top' | 'bottom' | 'left' | 'right'

  @Prop()
  width?: string;

  @Prop()
  height?: string;

  @Prop()
  minWidth?: string;

  @Prop()
  minHeight?: string;
}
@Component({
  name: 'MyDockPanelItem',
  extends: MyBase,
  mixins: [getCompOpts(MyDockPanelItemProp)]
})
class MyDockPanelItemModel extends Vue<MyDockPanelItemProp & MyBase> {
  stylePrefix = 'my-dock-panel-item-';
  render () {
    let dockPanel: MyDockPanelModel = this.$utils.findComponentUpward(this, 'MyDockPanel')
    let { direction, dock } = dockPanel.getDock(this.$vnode)
    let { width, height, minWidth, minHeight } = this

    let lIdx = dockPanel.items.length - 1 - dockPanel.items.indexOf(this.$vnode)
    height = lIdx == 0 || direction === 'row' ? 'auto' : height
    width = lIdx == 0 || direction === 'column' ? 'auto' : width

    let style = `width: ${width}; height: ${height}; min-width: ${minWidth}; min-height: ${minHeight};`
    return (
      <div class={[...this.getStyleName('root'), ...dockPanel.getStyleName(lIdx == 0 && 'stretch')]} style={style}>
        <div>{this.$slots.default}</div>
      </div>
    )
  }
}

export const MyDockPanelItem = convClass<MyDockPanelItemProp>(MyDockPanelItemModel)
