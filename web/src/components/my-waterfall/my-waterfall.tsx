import { Component, Vue, Watch } from 'vue-property-decorator'

import { Prop } from '@/components/property-decorator'

import { convClass, Utils, getCompOpts } from '../utils'
import { MyBase } from '../my-base'
import './my-waterfall.less'
import { Checkbox } from '../iview'
import { MyImgViewer, IMyImgViewer } from '../my-img-viewer'

export type MyWaterfallDataType = {
    src: string;
    data: any;
};
type MyWaterfallItemType = {
    data: MyWaterfallDataType,
    selected?: boolean,
    loaded: boolean,
    success: boolean,
    height: number,
    bottom?: number,
    left?: number,
    colIdx?: number,
    style: any,
    img: HTMLImageElement,
    timer?: any,
    index: number,
};

type GetDataFnResult<T> = { data: T[], finished?: boolean };

const ScrollElm = {
  window: 'window' as 'window',
  root: 'root' as 'root'
}
type TypeOfValue<T> = T[keyof T];

class MyWaterfallProp {
    @Prop({
      default: () => (width) => {
        let w = 128
        if (width > 768) { w = 198 }
        return Math.max(Math.floor(width / w), 1)
      }
    })
    col?: number | ((width: number) => number);

    @Prop({
      default: 10
    })
    space?: number;

    @Prop({
      default: 20
    })
    timeout?: number;

    /**
     * 滚动的元素，默认为window
     * 设为root时，给root一个高度
     */
    @Prop({
      default: ScrollElm.window
    })
    scrollElm?: TypeOfValue<typeof ScrollElm>;

    @Prop({
      required: true
    })
    getDataFn: <T = MyWaterfallDataType>() => GetDataFnResult<T> | Promise<GetDataFnResult<T>>;

    @Prop()
    maskContentRenderFn?: (item: any) => any;

    @Prop()
    selectable?: boolean;

    @Prop()
    noDefaultClickEvent?: boolean;
}
@Component({
  extends: MyBase,
  mixins: [getCompOpts(MyWaterfallProp)]
})
class MyWaterfall extends Vue<MyWaterfallProp & MyBase> {
    stylePrefix = 'my-waterfall-';

    $refs: { root: HTMLDivElement; imgViewer: IMyImgViewer };

    currVal: any[] = [];
    selectedVal: any[] = [];

    currUrl = '';
    private actualCol = 1;
    @Watch('col')
    private watchCol () {
      if (typeof this.col !== 'function') { this.actualCol = this.col } else { this.actualCol = this.col(this.$refs.root.clientWidth) }
    }
    @Watch('selectable')
    private watchSelectable (newVal) {
      if (!newVal) {
        this.itemList.forEach(ele => {
          ele.selected = false
        })
      }
    }

    itemList: MyWaterfallItemType[] = [];

    private getScrollElm () {
      return this.scrollElm === ScrollElm.root ? this.$refs.root : window
    }
    protected mounted () {
      this.watchCol()
      window.addEventListener('resize', this.handleResize)
      this.getScrollElm().addEventListener('scroll', this.handleScrollEnd)
    }

    protected beforeDestroy () {
      window.removeEventListener('resize', this.handleResize)
      this.getScrollElm().removeEventListener('scroll', this.handleScrollEnd)
    }

    private handleResize () {
      this.watchCol()
      this.handleItemStyle()
      this.handleScrollEnd()
    }

    private loading = false;
    private get imgLoading () {
      return !!this.itemList.find(ele => !ele.loaded)
    }
    private handleScrollEnd () {
      // console.log(this.$refs.root.clientWidth, !this.finished, !this.loading, !this.imgLoading, Utils.isScrollEnd(this.getScrollElm()));
      if (!this.finished && !this.loading && !this.imgLoading && Utils.isScrollEnd(this.getScrollElm())) {
        this.getData()
      }
    }

    protected created () {
      this.getData()
    }

    private finished = false;
    private errMsg = '';
    async getData (refresh?: boolean) {
      this.loading = true
      this.errMsg = ''
      try {
        const { data, finished } = await this.getDataFn()
        this.finished = finished
        this.currVal = refresh ? data : [...this.currVal, ...data]
      } catch (e) {
        this.errMsg = `出错了: ${e.message || '未知错误'}`
      }
      this.loading = false
    }
    @Watch('currVal')
    private watchCurrVal () {
      this.itemList = this.currVal.map((ele, idx) => {
        const old = this.itemList.find(e => e.data === ele)
        if (old) {
          old.index = idx
          return old
        }
        const img = new Image()

        const obj: MyWaterfallItemType = {
          index: idx,
          data: ele,
          loaded: false,
          success: false,
          height: 0,
          style: {} as any,
          img,
          selected: false
        }
        img.onload = img.onerror = (e) => {
          this.imgLoaded(obj)
        }
        if (this.timeout > 0) {
          obj.timer = setTimeout(() => {
            this.imgLoaded(obj)
          }, this.timeout * 1000)
        }
        img.src = ele.src
        return obj
      })
    }
    private imgLoaded (obj: MyWaterfallItemType) {
      const idx = this.itemList.findIndex(item => item === obj)
      if (obj.timer) { clearTimeout(obj.timer) }
      if (idx === -1 || obj.loaded) { return }
      const img = obj.img
      obj.loaded = true
      obj.success = !!img.height
      this.handleItemStyle()
    }

    private handleItemStyle () {
      /*
        |<----------clientWidth-------------->|<-space->|
        |  col1                 |  col2       |
        |<-itemWidth->|<-space->|<-itemWidth->|
        |                       |             |
        |-------------------------------------|
         */
      const padding = 3
      const clientWidth = this.$refs.root.clientWidth + this.space
      const itemWidth = Math.floor(clientWidth / this.actualCol) - this.space
      let lastShowIdx = -1
      let divHeight = 0
      for (let i = 0; i < this.itemList.length; i++) {
        const item = this.itemList[i]
        const show = item.loaded && lastShowIdx < i
        if (!show) { break }
        lastShowIdx = i

        /*
            已知：x(itemWidth),padding,imgX,imgY
            求y
            imgY/imgX = y1/x1
            => y = y1 + 2 * padding
                = imgY/imgX * x1 + 2 * padding
            |<-------x------->|
            |      padding    |
            |  |-----x1-----| |
            y  y1           | |
            |  |------------| |
            |                 |
            |-----------------|
            */
        const width = itemWidth
        const height = item.height = Math.round(item.img.height
          ? (item.img.height / item.img.width) * (width - 2 * padding) + 2 * padding
          : itemWidth)
        item.style = {
          width: width + 'px',
          height: height + 'px',
          padding: padding + 'px'
        }

        // 第一行
        let left = (itemWidth + this.space) * i; let top = 0
        item.colIdx = i % this.actualCol
        if (i >= this.actualCol) {
          // 记录每一列最后一个,获取bottom最小的,在该item下面添加当前元素
          const colDict = {}
          for (let idx = 0; idx < i; idx++) {
            const ele = this.itemList[idx]
            colDict[ele.colIdx] = ele
          }
          let minBottomCol: MyWaterfallItemType
          Object.values<MyWaterfallItemType>(colDict).forEach(ele => {
            if (!minBottomCol || minBottomCol.bottom > ele.bottom) { minBottomCol = ele }
          })
          item.colIdx = minBottomCol.colIdx
          top = minBottomCol.bottom + this.space
          left = minBottomCol.left
        }
        item.bottom = top + item.height
        item.left = left
        item.style.top = top + 'px'
        item.style.left = left + 'px'
        item.style.transform = 'scale(1)'
        if (item.bottom > divHeight) {
          divHeight = item.bottom
        }
      }
      this.divHeight = divHeight
      // 高度不足时触发加载
      this.handleScrollEnd()
    }

    removeItem (idxList: number[]) {
      for (let i = this.currVal.length - 1; i > 0; i--) {
        if (idxList.includes(i)) {
          this.currVal.splice(i, 1)
        }
      }
      this.$nextTick(() => {
        this.handleItemStyle()
      })
    }

    private divHeight = 0;
    protected render () {
      return (
        <div ref='root' class={this.getStyleName('root')}>
          <MyImgViewer ref='imgViewer' src={this.currUrl} />
          <div class={this.getStyleName('main')} style={{ height: this.divHeight + 'px' }}>
            {this.itemList.map((ele, idx) => {
              return (
                <div class={this.getStyleName('item')} style={ele.style} >
                  <img src={ele.data.src} />
                  <div class={this.getStyleName('click-box')} on-click={(e) => {
                    const item = ele.data
                    this.currUrl = item.src
                    if (!this.noDefaultClickEvent) {
                      this.$refs.imgViewer.show()
                    }
                    this.$emit('item-click', e, item)
                  }} />
                  {this.selectable && <Checkbox v-model={ele.selected} class={this.getStyleName('select-box')} />}
                  <div class={this.getStyleName('item-mask')}>
                    {this.maskContentRenderFn && this.maskContentRenderFn(ele.data) || ele.data.src}
                  </div>
                </div>
              )
            })}
          </div>
          <div class={this.getStyleName('bottom-box')}>
            {this.errMsg
              ? <span>{this.errMsg}<a on-click={() => {
                this.getData()
              }}>重试</a></span>
              : <div>
                {this.finished && !this.imgLoading && (this.$slots.loaded || <span>加载完毕</span>)}
                {(this.loading || this.imgLoading) && (this.$slots.loading || <span>加载中</span>)}
                {!this.finished && !this.loading && !this.imgLoading &&
                                (<div class={this.getStyleName('more')} on-click={() => {
                                  this.getData()
                                }}>{this.$slots.more || '更多'}</div>)}
              </div>
            }
          </div>
        </div>
      )
    }
}

const MyWaterfallView = convClass<MyWaterfallProp>(MyWaterfall)
export default MyWaterfallView
export interface IMyWaterfallView extends MyWaterfall { };
