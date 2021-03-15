import { Component, Vue, Watch } from 'vue-property-decorator'
import Hammer from 'hammerjs'

import { Prop } from '@/components/property-decorator'

import { convClass, getCompOpts } from '../utils'
import { Carousel, CarouselItem, Icon, Button } from '../iview'
import { MyImg } from '../my-img'
import { MyBase } from '../my-base'
import * as style from '../style'

import './style.less'

class MyImgViewerProp {
    @Prop({
      default: ''
    })
    src: string | string[];

    @Prop({
      default: 0
    })
    idx?: number;

    @Prop({
      default: true
    })
    maskClosable?: boolean;
}
@Component({
  extends: MyBase,
  mixins: [getCompOpts(MyImgViewerProp)]
})
class MyImgViewer extends Vue<MyImgViewerProp & MyBase> {
    stylePrefix = 'my-img-viewer-';

    created () {
      this.watchSrc()
    }
    private list: { src: string; }[] = [];
    @Watch('src')
    private watchSrc () {
      this.list = (this.src instanceof Array ? this.src : [this.src]).map(src => {
        return {
          src
        }
      })
    }

    visible = false;

    show () {
      this.visible = true
    }

    hide () {
      this.visible = false
    }

    render () {
      const list = this.list
      const mutli = list.length > 1
      return (
        <transition name='fade'>
          {this.visible && <div class={style.cls.mask}
            on-click={() => {
              if (this.maskClosable) { this.hide() }
            }} >
            <div class={this.getStyleName('stop-box')}
              on-touchmove={(event) => {
                event.preventDefault()
              }}
              on-mousewheel={(event) => {
                event.preventDefault()
              }} />
            <div class={this.getStyleName('box')}
              on-click={(event) => {
                event.stopPropagation()
              }}>
              <Carousel class={this.getStyleName('content')} value={this.idx}
                arrow={mutli ? 'hover' : 'never'}
                dots={mutli ? 'inside' : 'none'}>
                {list.map(ele => {
                  return (
                    <CarouselItem>
                      <div class={this.getStyleName('item')}>
                        <GestureView>
                          <MyImg class={this.getStyleName('img')} src={ele.src} />
                        </GestureView>
                      </div>
                    </CarouselItem>
                  )
                })}
              </Carousel>
              <Button shape='circle' icon='md-close' type='error' class={this.getStyleName('close-btn')} on-click={this.hide} />
            </div>
          </div>}
        </transition>
      )
    }
}

const MyImgViewerView = convClass<MyImgViewerProp>(MyImgViewer)
export default MyImgViewerView
export interface IMyImgViewer extends MyImgViewer { }

@Component({
  extends: MyBase
})
class Gesture extends Vue<MyBase> {
    stylePrefix = 'my-gesture-';
    $refs: { root: HTMLDivElement };
    private startX = 0;
    private startY = 0;
    x = 0;
    y = 0;
    scale = 1;

    private reset () {
      this.x = 0
      this.y = 0
      this.scale = 1
      this.updatePos()
    }

    private updatePos () {
      this.startX = this.x
      this.startY = this.y
    }
    mounted () {
      const hammer = new Hammer(this.$refs.root)
      hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL })
      hammer.on('panmove panend', (event) => {
        this.x = this.startX + event.deltaX
        this.y = this.startY + event.deltaY
        if (event.type === 'panend') {
          this.updatePos()
        }
      })
      hammer.get('pinch').set({
        enable: true
      })
      hammer.on('pinchin pinchout', (ev) => {
        this.scaleHandler(ev.type == 'pinchout')
      })
      hammer.on('doubletap', () => {
        this.reset()
      })

      this.$refs.root.addEventListener('mousedown', this.mousedownHandler)
    }

    beforeDestroy () {
      this.$refs.root.removeEventListener('mousedown', this.mousedownHandler)
    }
    scaleHandler (scaleUp: boolean) {
      let scale = this.scale
      const step = 0.05
      scale = scale + ((scaleUp ? 1 : -1) * step)
      if (scale > 5) {
        scale = 5
      } else if (scale < 0.5) {
        scale = 0.5
      }
      this.scale = scale
    }

    mousedownHandler (event) {
      event.preventDefault()
    }

    render () {
      const transform = `scale(${this.scale}) translate(${this.x}px, ${this.y}px)`
      return (
        <div ref='root' class={[...this.getStyleName('root'), 'center']}
          on-mousewheel={(event) => {
            event.preventDefault()
            this.scaleHandler(event.wheelDeltaY > 0)
          }}>
          <div class={this.getStyleName('main')} style={{
            transform
          }}>
            {this.$slots.default}
          </div>
        </div>
      )
    }
}
const GestureView = convClass(Gesture)
