import { Component, Vue, Watch } from 'vue-property-decorator'

import { Button } from '@/components/iview'
import { MyWaterfall } from '@/components/my-waterfall'

import { Base } from '../base'
import './demo.less'
@Component
export default class Waterfall extends Base {
    $refs: { root: HTMLDivElement; };
    stylePrefix = 'waterfall-';
    imgsArr = [];
    group = 0;
    type = '0';

    @Watch('$route')
    watchRoute () {
      this.type = this.$route.query.type as any
    }

    created () {
      this.getData()
      this.watchRoute()
    }

    async getDataFn (refresh?: boolean) {
      return new Promise<any>((resolve) => {
        const list = Array.from(new Array(10)).map((ele, idx) => {
          const source = [
            'https://nodejs.org/static/images/logo.svg',
            'https://cn.vuejs.org/images/logo.png',
            'https://file.iviewui.com/logo-new.svg',
            'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b?ver=5c31',
            'https://www.tslang.cn/assets/images/ideicons/vscode.svg',
            'http://nginx.org/nginx.png',
            'https://www.typescriptlang.org/assets/images/logo_nocircle.svg',
            'http://lesscss.org/public/img/less_logo.png'
          ]
          const src = source[idx % source.length]
          return {
            src
          }
        })
        this.imgsArr = refresh ? list : [...this.imgsArr, ...list]
        setTimeout(() => {
          resolve({
            data: list,
            finished: this.imgsArr.length > 50
          })
        }, 1000)
      })
    }

    getData (refresh?: boolean) {
      this.getDataFn(refresh)
      this.group++
    }

    render () {
      return (
        <div ref='root' class={this.getStyleName('root')}>
          {this.type == '1'
            ? <MyWaterfall
              scrollElm='root'
              style={{ height: '300px' }}
              getDataFn={() => {
                return this.getDataFn()
              }}
              maskContentRenderFn={(item) => {
                return <div>test{item.src}</div>
              }}
            />
            : <MyWaterfall
              getDataFn={() => {
                return this.getDataFn()
              }}
              maskContentRenderFn={(item) => {
                return <div>test{item.src}</div>
              }}
            />
          }
        </div>
      )
    }
}
