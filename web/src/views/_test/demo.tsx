import { Watch } from 'vue-property-decorator'
import * as echarts from 'echarts'
import { VideoJsPlayer } from 'video.js'

import { Component, Vue, Prop } from '@/components/decorator'
import { testSocket, testApi } from '@/api'
import { Input, Card, Button, Checkbox } from '@/components/iview'
import { MyList } from '@/components/my-list'
import { MyUpload } from '@/components/my-upload'
import { MyVideo } from '@/components/my-video'
import { MyEditor } from '@/components/my-editor'
import { MyQrcode } from '@/components/my-qrcode'

import { Base } from '../base'
import './demo.less'
import { MyButtons } from '@/components/my-buttons'

@Component({})
export default class App extends Base {
  protected stylePrefix = 'demo-'
  public value = ''
  public msg = ''
  public list: { test: string }[] = []
  color = 'white'
  public get valueLength() {
    return this.value.length
  }

  $refs: {
    board: HTMLElement
    list: MyList<any>
    echart: HTMLDivElement
    canvas: HTMLDivElement
    upload: MyUpload
    video: MyVideo
    videoCover: any
  }
  richText = ''
  chart: echarts.ECharts
  chartAddData = ''
  player: VideoJsPlayer

  public created() {
    this.setList()
    testSocket.bindDanmakuRecv(this.recvDanmaku)
    const query: any = this.$route.query
    if (query.videoId) {
      this.videoId = this.videoIdText = query.videoId as any
    }
  }

  mounted() {
    this.$refs.list.query()
    this.chart = echarts.init(this.$refs.echart)
    this.setECharts()
    this.player = this.$refs.video.player
    // this.player.on(DanmakuPlayer.Event.danmakuSend, (e, data) => {
    //     console.log(data);
    // });
  }

  setECharts() {
    const optionData: any = {
      xAxis: {
        type: 'category',
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          data: [820, 932, 901, 934, 1290, 1330, 1320],
          type: 'line',
          // smooth: true
        },
      ],
    }

    this.chart.setOption(optionData)
  }

  public handleClick() {
    this.setList()
  }

  setList(start = 0, size = 10) {
    this.list = new Array(size).fill('').map((e, i) => {
      return {
        test: i + start + 1 + '',
      }
    })
  }

  @Watch('value')
  protected valueWatch(newV: any, oldV: any) {
    this.msg = `new value：${newV}`
  }

  recvDanmaku(data) {
    this.$refs.video.danmakuPlayer.danmakuPush(data)
  }

  captureImage() {
    return this.$refs.video.capture().data
  }

  fail = false
  btnDisabled = false
  upload = {
    maxSize: 102400,
  }
  protected render() {
    return (
      <div>
        <MyButtons
          value={[
            {
              name: 'test',
              text: '测试',
              type: 'text',
              enable: () => {
                return this.btnDisabled
              },
            },
            {
              name: 'testGroup1',
              text: '测试组1',
              group: '测试组',
              click: (btn) => {
                this.$Message.info(`点击了${btn.name}`)
              },
            },
            {
              name: 'testGroup2',
              text: '测试组2',
              group: '测试组',
              click: (btn) => {
                this.btnDisabled = !this.btnDisabled
              },
            },
          ]}
        />
        <Tsx />
        <Tsx2 test="传参属性1" />
        <MyQrcode text="qrcode" showText />
        <div class={this.getStyleName('col')}>
          {this.renderVideo()}
          <div class={this.getStyleName('row')}>
            <MyUpload
              ref="upload"
              width={400}
              height={300}
              headers={testApi.defaultHeaders}
              uploadUrl={testApi.fileUploadByChunksUrl}
              uploadCheckUrl={testApi.fileUploadCheckUrl}
              uploadByChunks
              maxSize={this.upload.maxSize}
              resHandler={(res) => {
                return testApi.resHandler(res)
              }}
              successHandler={(rs, file) => {
                file.url = rs.url
                return rs.fileId
              }}
            />
            <div>
              <div class={this.getStyleName('row')}>
                文件最大size
                <Input v-model={this.upload.maxSize} />k
              </div>
              <Button
                on-click={() => {
                  this.operateHandler('上传', async () => {
                    const err = await this.$refs.upload.upload()
                    if (err.length) {
                      throw new Error(err.join(','))
                    }
                  })
                }}
              >
                upload
              </Button>
            </div>
          </div>
          <div>{this.renderEditor()}</div>
        </div>

        {this.renderList()}
      </div>
    )
  }

  videoIdText = ''
  videoId = '5da80f96cb21fc0abc856e75'
  renderVideo() {
    const danmakuList = []
    // test
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 3; j++) {
        danmakuList.push({
          msg: 'test' + (i * 3 + j),
          pos: i * 1000 + j * 500,
        })
      }
    }
    return (
      <div>
        <div class={this.getStyleName('danmaku-main')}>
          <Input
            v-model={this.videoIdText}
            search
            enter-button="确认"
            on-on-search={() => {
              this.videoId = this.videoIdText
              const url =
                testApi.getVideoUrl(this.videoId) ||
                'http://vjs.zencdn.net/v/oceans.mp4'
              this.player.src({
                type: 'video/mp4',
                src: url,
              })
              this.player.load()
              this.player.currentTime(0)
              this.player.play()
            }}
          />
          <MyVideo
            ref="video"
            options={{
              poster:
                '//localhost:8000/devMgt/img?_id=5da818d6433fe2209054c290',
              sources: [
                {
                  type: 'video/mp4',
                  src: testApi.getVideoUrl(this.videoId),
                },
              ],
              danmaku: {
                danmakuList,
                // sendFn: async (data) => {
                //     let rs = await this.operateHandler('发送弹幕', async () => {
                //         data.videoId = this.videoId;
                //         await testApi.danmakuSubmit(data);
                //     }, { noSuccessHandler: true });
                //     return rs.success;
                // }
              },
            }}
          />
        </div>
        <div
          style={{
            display: 'inline-block',
          }}
        >
          <Button
            on-click={() => {
              this.$refs.videoCover.src = this.captureImage()
            }}
          >
            截取
          </Button>
          <img width="160" height="90" ref="videoCover" />
        </div>
      </div>
    )
  }

  renderEditor() {
    return (
      <div
        style={{
          display: 'inline-block',
          width: '600px',
          verticalAlign: 'top',
        }}
      >
        <MyEditor v-model={this.richText} placeholder="输点啥。。。" />
        <Button
          on-click={() => {
            console.log(this.richText)
          }}
        >
          log
        </Button>
        <div ref="echart" style={{ height: '300px', width: '500px' }}></div>
        <Input
          v-model={this.chartAddData}
          search
          enter-button="添加"
          on-on-search={() => {
            const num = parseFloat(this.chartAddData)
            if (!isNaN(num)) {
              const opt = this.chart.getOption()
              const data: number[] = (opt.series[0] as any).data
              data.shift()
              data.push(num)
              this.chart.setOption(opt)
              this.chartAddData = ''
            }
          }}
        />
      </div>
    )
  }

  renderList() {
    return (
      <MyList
        ref="list"
        type="custom"
        infiniteScroll
        customQueryNode={
          <label>
            <Checkbox v-model={this.fail} />
            失败
          </label>
        }
        on-query={(model, noClear) => {
          const q = { ...model.query }
          this.$refs.list.query(q, noClear)
        }}
        queryFn={async () => {
          const page = this.$refs.list.model.page
          const total = 25
          const start = (page.index - 1) * page.size

          const size = start + page.size > total ? total - start : page.size
          this.setList((page.index - 1) * page.size, size)
          await this.$utils.wait(2000)
          return {
            rows: this.list,
            total,
          }
        }}
        customRenderFn={(rs) => {
          const list = rs.data.map((ele) => {
            return <Card style={{ marginBottom: '10px' }}>{ele.test}</Card>
          })
          return list
        }}
      ></MyList>
    )
  }
}

class PropClass {
  @Prop({
    default: '组件1',
  })
  cname?: string

  @Prop({
    required: false,
    default: '属性1',
  })
  test?: string
}

@Component({
  props: PropClass,
})
class Tsx extends Vue<PropClass> {
  testFn() {
    return this.cname
  }
  protected render() {
    return (
      <div>
        {this.testFn()},{this.test},1111111111
      </div>
    )
  }
}

class PropClass2 {
  @Prop({
    default: '组件2',
  })
  cname?: string

  @Prop({
    required: true,
    default: '属性1',
  })
  test?: string

  @Prop({
    default: '属性2',
  })
  test2?: number
}

@Component({
  extends: Tsx,
  props: PropClass2,
})
class Tsx2 extends Vue<PropClass2, Tsx> {
  protected render() {
    return (
      <div>
        <div>
          {this.testFn()},{this.test},222222
        </div>
        <div>
          {this.testFn()},{this.test2},222222
        </div>
      </div>
    )
  }
}
