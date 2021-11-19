import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop } from '@/components/decorator'
import { Button } from '@/components/iview'
import flvjs from 'flv.js'

import { Base } from '../base'
import './demo.less'
@Component
export default class Live extends Base {
  $refs: { video: HTMLVideoElement }
  private flvPlayer: flvjs.Player = null;

  mounted() {
    this.play('http://127.0.0.1:8888/live.flv');
  }

  render() {
    return (
      <div style="width: 800px; height: 600px">
        <section>
          <video class="full-height full-width" ref="video" width="800"></video>
        </section>
      </div>
    )
  }


  play(url) {
    if (flvjs.isSupported()) {
      let videoElement = this.$refs.video;
      let flvPlayer = this.flvPlayer = flvjs.createPlayer({
        type: 'flv',
        url
      });
      flvPlayer.attachMediaElement(videoElement);
      flvPlayer.load();
      flvPlayer.play();
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
