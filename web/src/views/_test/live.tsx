import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop } from '@/components/decorator'
import { Button, Input } from '@/components/iview'
import flvjs from 'flv.js'
import { testSocket, testApi } from '@/api'

import { Base } from '../base'
import './demo.less'
import { MyLoad } from '@/components/my-load'
@Component
export default class Live extends Base {
  $refs: { video: HTMLVideoElement }
  private flvPlayer: flvjs.Player = null
  private liveUrl = ''
  private liveInfo: { rtmp: string; key: string }

  mounted() {}

  render() {
    return (
      <div>
        <MyLoad
          ref="loadView"
          loadFn={this.loadDetail}
          afterLoad={() => {
            this.play(this.liveUrl)
          }}
          renderFn={() => {
            return this.renderDetail()
          }}
        />
      </div>
    )
  }

  async loadDetail() {
    // let data = await testApi.liveInfo();
    this.liveInfo = {} as any
    this.liveUrl =
      'http://192.168.0.103:8888/live?port=1935&app=live&stream=test'
  }

  renderDetail() {
    return (
      <div>
        <span>rtmp服务器</span>
        <Input v-model={this.liveInfo.rtmp} />
        <span>rtmp串流码</span>
        <Input v-model={this.liveInfo.key} />
        <div style="width: 800px; height: 600px">
          <section>
            <video
              class="full-height full-width"
              ref="video"
              width="800"
            ></video>
          </section>
        </div>
      </div>
    )
  }

  play(url) {
    if (flvjs.isSupported()) {
      let videoElement = this.$refs.video
      let flvPlayer = (this.flvPlayer = flvjs.createPlayer({
        type: 'flv',
        url,
      }))
      flvPlayer.attachMediaElement(videoElement)
      flvPlayer.load()
      flvPlayer.play()
    }
  }

  stop() {
    if (this.flvPlayer) {
      this.flvPlayer.pause()
      this.flvPlayer.unload()
      this.flvPlayer.detachMediaElement()
      this.flvPlayer.destroy()
      this.flvPlayer = null
    }
  }

  beforeDestroy() {
    this.stop()
  }
}
