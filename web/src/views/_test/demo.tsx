import { Component, Vue, Watch } from 'vue-property-decorator'
import * as echarts from 'echarts'
import * as QRCode from 'qrcode'
import { VideoJsPlayer } from 'video.js'

import { Prop } from '@/components/property-decorator'
import { testSocket, testApi } from '@/api'
import { Input, Card, Button, Checkbox } from '@/components/iview'
import { MyList, IMyList } from '@/components/my-list'
import { MyUpload, IMyUpload } from '@/components/my-upload'
import { MyVideo, IMyVideo } from '@/components/my-video'
import { MyEditor } from '@/components/my-editor'
import { convClass, getCompOpts } from '@/components/utils'

import { Base } from '../base'
import './demo.less'

@Component({})
export default class App extends Base {
  protected stylePrefix = 'demo-';
  public value = '';
  public msg = '';
  public list: { test: string }[] = [];
  color = 'white';
  public get valueLength () {
    return this.value.length
  }

  $refs: {
    board: HTMLElement; list: IMyList<any>; echart: HTMLDivElement; canvas: HTMLDivElement;
    upload: IMyUpload; video: IMyVideo; videoCover: any;
  };
  richText = '';
  chart: echarts.ECharts;
  chartAddData = '';
  player: VideoJsPlayer;

  public created () {
    this.setList()
    testSocket.bindDanmakuRecv(this.recvDanmaku)
    const query: any = this.$route.query
    if (query.videoId) {
      this.videoId =
        this.videoIdText =
        query.videoId as any
    }
  }

  mounted () {
    this.$refs.list.query()
    this.chart = echarts.init(this.$refs.echart)
    this.setECharts()
    this.qrcode()
    this.player = this.$refs.video.player
    // this.player.on(DanmakuPlayer.Event.danmakuSend, (e, data) => {
    //     console.log(data);
    // });
  }

  async qrcode () {
    await QRCode.toCanvas(this.$refs.canvas, 'qrcode').catch(e => {
      console.error(e)
    })
  }

  setECharts () {
    const optionData: any = {
      xAxis: {
        type: 'category',
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        data: [820, 932, 901, 934, 1290, 1330, 1320],
        type: 'line'
        // smooth: true
      }]
    }

    this.chart.setOption(optionData)
  }

  public handleClick () {
    this.setList()
  }

  setList (start = 0, size = 10) {
    this.list = new Array(size).fill('').map((e, i) => {
      return {
        test: i + start + 1 + ''
      }
    })
  }

  @Watch('value')
  protected valueWatch (newV: any, oldV: any) {
    this.msg = `new value：${newV}`
  }

  recvDanmaku (data) {
    this.$refs.video.danmakuPlayer.danmakuPush(data)
  }

  captureImage () {
    return this.$refs.video.capture().data
  }

  fail = false;
  protected render () {
    return (
      <div>
        <TsxView />
        <TsxView2 test='传参属性1' />
        <div class={this.getStyleName('box1')}>
          {this.renderVideo()}
          {this.renderEditor()}
          <canvas ref='canvas'></canvas>
          <div>
            <MyUpload ref='upload' width={100} height={100}
              headers={testApi.defaultHeaders}
              uploadUrl={testApi.videoUploadUrl} maxSize={10240} successHandler={(res, file) => {
                testApi.uplodaHandler(res)
              }} />
            <Button on-click={() => {
              this.operateHandler('上传', async () => {
                const err = await this.$refs.upload.upload()
                if (err.length) {
                  throw new Error(err.join(','))
                }
              })
            }}>upload</Button>
          </div>
        </div>

        {this.renderList()}
      </div >
    )
  }

  videoIdText = '';
  videoId = '5da6efd5929f9b23549931ef';
  renderVideo () {
    const danmakuList = []
    // test
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 3; j++) {
        danmakuList.push({
          msg: 'test' + (i * 3 + j),
          pos: i * 1000 + j * 500
        })
      }
    }
    return (
      <div>
        <div class={this.getStyleName('danmaku-main')}>
          <Input v-model={this.videoIdText} search enter-button='确认'
            on-on-search={() => {
              this.videoId = this.videoIdText
              const url = testApi.getVideoUrl(this.videoId) || 'http://vjs.zencdn.net/v/oceans.mp4'
              this.player.src({
                type: 'video/mp4',
                src: url
              })
              this.player.load()
              this.player.currentTime(0)
              this.player.play()
            }} />
          <MyVideo ref='video' options={{
            poster: '//localhost:8000/devMgt/img?_id=5da818d6433fe2209054c290',
            sources: [{
              type: 'video/mp4',
              src: testApi.getVideoUrl(this.videoId)
            }],
            danmaku: {
              danmakuList
              // sendFn: async (data) => {
              //     let rs = await this.operateHandler('发送弹幕', async () => {
              //         data.videoId = this.videoId;
              //         await testApi.danmakuSubmit(data);
              //     }, { noSuccessHandler: true });
              //     return rs.success;
              // }
            }
          }} />
        </div>
        <div style={{
          display: 'inline-block'
        }}>
          <Button on-click={() => {
            this.$refs.videoCover.src = this.captureImage()
          }}>截取</Button>
          <img width='160' height='90' ref='videoCover' />
        </div>
      </div>
    )
  }

  renderEditor () {
    return (
      <div style={{
        display: 'inline-block',
        width: '600px',
        verticalAlign: 'top'
      }}>
        <MyEditor v-model={this.richText} placeholder='输点啥。。。' />
        <Button on-click={() => {
          console.log(this.richText)
        }}>log</Button>
        <div ref='echart' style={{ height: '300px', width: '500px' }}></div>
        <Input v-model={this.chartAddData} search enter-button='添加' on-on-search={() => {
          const num = parseFloat(this.chartAddData)
          if (!isNaN(num)) {
            const opt = this.chart.getOption()
            const data: number[] = (opt.series[0] as any).data
            data.shift()
            data.push(num)
            this.chart.setOption(opt)
            this.chartAddData = ''
          }
        }} />
      </div>
    )
  }

  renderList () {
    return (
      <MyList ref='list' type='custom' infiniteScroll
        customQueryNode={
          <label>
            <Checkbox v-model={this.fail} />失败
          </label>
        }
        on-query={(model, noClear) => {
          const q = { ...model.query }
          this.$refs.list.query(q, noClear)
        }}

        queryFn={() => {
          const page = this.$refs.list.model.page
          const total = 25
          const start = (page.index - 1) * page.size

          const size = start + page.size > total ? total - start : page.size
          this.setList((page.index - 1) * page.size, size)
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              if (this.fail) { return reject(new Error('test')) }
              resolve({
                rows: this.list,
                total
              })
            }, 2000)
          })
        }}

        customRenderFn={(rs) => {
          const list = rs.data.map(ele => {
            return <Card style={{ marginBottom: '10px' }}>{ele.test}</Card>
          })
          return list
        }}></MyList>
    )
  }
}

class PropClass {
  @Prop({
    default: '组件1'
  })
  cname?: string;

  @Prop({
    required: false,
    default: '属性1'
  })
  test?: string;
}

@Component({
  mixins: [getCompOpts(PropClass)]
})
class Tsx extends Vue<PropClass> {
  testFn () {
    return this.cname
  }
  protected render () {
    return <div>{this.testFn()},{this.test},1111111111</div>
  }
}
const TsxView = convClass<PropClass>(Tsx)

class PropClass2 extends PropClass {
  @Prop({
    default: '组件2'
  })
  cname?: string;

  @Prop({
    required: true,
    default: '属性1'
  })
  test?: string;

  @Prop({
    default: '属性2'
  })
  test2?: number;
}

@Component({
  extends: Tsx,
  mixins: [getCompOpts(PropClass2)]
})
class Tsx2 extends Vue<PropClass2 & Tsx> {
  protected render () {
    return (
      <div>
        <div>{this.testFn()},{this.test},222222</div>
        <div>{this.testFn()},{this.test2},222222</div>
      </div>
    )
  }
}
const TsxView2 = convClass<PropClass2>(Tsx2)
