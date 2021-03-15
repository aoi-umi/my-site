import videojs, { VideoJsPlayer } from 'video.js'
import anime from 'animejs'
import 'video.js/dist/video-js.min.css'

import './videojs-comp.less'

const clsPrefix = 'vjs-danmaku-'
function getClsName (prefix, ...cls) {
  return cls.map(ele => prefix + ele).join(' ')
}
type DanmakOptions = {
    hide?: boolean;
    danmakuList?: DanmakuDataType[],
    sendFn?: (data) => boolean | Promise<boolean>,
    elementAfterInput?: HTMLElement | HTMLElement[];
};
export type DanmakuDataType = {
    msg: string,
    color?: string;
    pos: number;
    isSelf?: boolean;
    createdAt?: string;
}
type DanmakuDataTypeInner = DanmakuDataType & { add?: boolean };
export type DanmakuPlayerOptions = videojs.PlayerOptions & {
    danmaku?: DanmakOptions
}
const KeyCode = {
  space: 32,
  left: 37,
  up: 38,
  right: 39,
  down: 40
}
const Event = {
  danmakuSend: 'danmakuSend',
  widthChange: 'widthChange'
}
for (const key in Event) {
  Event[key] = Event[key].toLocaleLowerCase()
}
export class DanmakuPlayer {
    static Event = Event;
    player: VideoJsPlayer;
    input: HTMLInputElement;
    sendBtn: HTMLButtonElement;
    danmakuBoard: HTMLDivElement;
    get options () {
      return this.player.options_ as DanmakuPlayerOptions
    }
    constructor (id: any, options?: DanmakuPlayerOptions, ready?: () => void) {
      options.danmaku = {
        ...options.danmaku
      }
      this.player = videojs(id, options, ready)
      if (options.danmaku.danmakuList) {
        this.danmakuDataList = [
          ...options.danmaku.danmakuList
        ]
      }
      this.initView()
      this.bindEvent()
    }

    private initView () {
      const player = this.player
      // 修改control bar
      const controlBar = player.controlBar
      const controlBarEl = controlBar.el()
      const danmakuOpt = this.options.danmaku
      const danmakuHide = danmakuOpt.hide
      const danmakuBar = videojs.dom.createEl('div', {
        className: getClsName(clsPrefix, 'bar') + ' ' + (danmakuHide ? 'vjs-hidden' : '')
      })
      const input = this.input = videojs.dom.createEl('input', {
        placeholder: '输点啥',
        className: getClsName(clsPrefix, 'input')
      }) as any

      const sendBtn = this.sendBtn = videojs.dom.createEl('button', {
        innerText: '发送',
        className: getClsName(clsPrefix, 'send') + ' vjs-control vjs-button'
      }) as any
      danmakuBar.append(input)
      if (danmakuOpt.elementAfterInput) {
        danmakuBar.append(...(danmakuOpt.elementAfterInput instanceof Array ? danmakuOpt.elementAfterInput : [danmakuOpt.elementAfterInput]))
      }
      danmakuBar.append(sendBtn)
      const statusBar2 = videojs.dom.createEl('div', {
        tabIndex: -1,
        className: getClsName(clsPrefix, 'status-bar')
      })
      const child = controlBarEl.children
      statusBar2.append(...child)

      // let statusBar1 = videojs.dom.createEl('div', {
      //     tabIndex: -1,
      //     className: getClsName(clsPrefix, 'status-bar'),
      // });
      // let progress = controlBarEl.querySelector('.vjs-progress-control');
      // let remainingTime = controlBarEl.querySelector('.vjs-remaining-time');
      // controlBarEl.querySelector('.vjs-fullscreen-control').before(videojs.dom.createEl('div', {
      //     tabIndex: -1,
      //     style: 'flex:auto'
      // }));
      // statusBar1.append(progress, remainingTime);
      controlBarEl.append(danmakuBar, /* statusBar1,*/ statusBar2)

      // 弹幕层
      const poster = player.el().querySelector('.vjs-poster')
      const danmakuBoard = this.danmakuBoard = videojs.dom.createEl('div', {
        tabIndex: -1,
        className: getClsName(clsPrefix, 'board')
      }) as any
      poster.after(danmakuBoard)
    }

    private startPos = 0;
    private videoWidth = 0;
    private bindEvent () {
      // 快进/快退
      this.player.on('keydown', this.keydownHandler.bind(this))
      this.player.on('keypress', (e: KeyboardEvent) => {
        if (e.keyCode === KeyCode.space) {
          this.player.paused() ? this.player.play() : this.player.pause()
        }
        // if ([KeyCode.space, KeyCode.left, KeyCode.right].includes(e.keyCode))
        e.preventDefault()
      })
      this.player.on('timeupdate', this.timeUpdateHandler.bind(this))
      // 暂停/播放
      this.player.on('play', () => {
        if (!this.player.seeking()) { this.handlePlayPause(true) }
      })
      this.player.on('pause', () => {
        this.handlePlayPause(false)
      })
      this.player.on('seeking', () => {
        this.startPos = this.player.currentTime() * 1000
        this.seek()
      })
      this.player.on('seeked', () => {
        if (!this.player.paused()) { this.handlePlayPause(true) }
      })

      this.input.addEventListener('keydown', (e: KeyboardEvent) => {
        e.stopPropagation()
      })

      this.input.addEventListener('keypress', (e: KeyboardEvent) => {
        if (e.keyCode === 13) { this.sendDanmaku() }
        e.stopPropagation()
      })

      this.sendBtn.addEventListener('click', this.sendDanmaku.bind(this))

      this.danmakuBoard.addEventListener('click', this.handleBoardClick.bind(this))

      // 大小改变
      this.videoWidth = this.danmakuBoard.clientWidth
      window.addEventListener('resize', this.resizeHandler.bind(this))
      this.player.on(Event.widthChange, this.resize.bind(this))
    }

    private keydownHandler (e: KeyboardEvent) {
      const player = this.player
      const skipTime = 5
      let skip = 0
      if (e.keyCode === KeyCode.right) {
        skip = skipTime
      } else if (e.keyCode === KeyCode.left) {
        skip = skipTime * -1
      }

      const currTime = player.currentTime()
      if (skip !== 0) { player.currentTime(currTime + skip) }

      const vol = 0.1
      let changeVol = 0
      if (e.keyCode === KeyCode.up) {
        changeVol = vol
      } else if (e.keyCode === KeyCode.down) {
        changeVol = vol * -1
      }

      const currVol = player.volume()
      if (changeVol !== 0) { player.volume(currVol + changeVol) }

      if ([KeyCode.right, KeyCode.left, KeyCode.up, KeyCode.down].includes(e.keyCode)) {
        e.preventDefault()
      }
    }

    private handleBoardClick (e: MouseEvent) {
      const player = this.player
      if (!(player.controls() as any)) {
        return
      }

      if (player.tech(true)) {
        player.tech(true).focus()
      }

      if (player.paused()) {
        player.play()
      } else {
        player.pause()
      }
    }

    private handlePlayPause (play: boolean) {
      // console.log('danmaku play', play);
      // console.log(new Error().stack);
      this.danmakuList.forEach(ele => {
        if (ele.animeInst && !ele.finished) {
          if (play) {
            ele.animeInst.play()
          } else {
            ele.animeInst.pause()
          }
        }
      })
    }

    private seek () {
      this.danmakuList.forEach(ele => {
        delete ele.animeInst
        if (ele.dom) {
          ele.dom.remove()
          delete ele.dom
        }
      })
      this.danmakuList = []
      this.danmakuDataList.forEach(ele => {
        ele.add = false
      })
      this.updateDanmaku(true)
    }

    private timeUpdateHandler () {
      const currPos = this.player.currentTime() * 1000
      const list = this.danmakuDataList.filter(ele => !ele.add && ele.pos >= this.startPos && ele.pos <= currPos)
      this.addDanmaku(list)
    }

    private resizeHandler () {
      const clientWidth = this.danmakuBoard.clientWidth
      if (this.videoWidth != clientWidth) {
        this.player.trigger(DanmakuPlayer.Event.widthChange)
        this.videoWidth = clientWidth
      }
    }

    private resize () {
      this.danmakuList.forEach(ele => {
        // ele.animeInst.
      })
    }

    danmakuDataList: DanmakuDataTypeInner[] = [];
    danmakuList: (DanmakuDataType & {
        idx?: number,
        animeInst?: anime.AnimeInstance,
        finished?: boolean,
        dom?: HTMLElement,
        playNow?: boolean;
    })[] = [];

    private get danmaku () {
      return this.input.value
    }
    private set danmaku (val) {
      this.input.value = val
    }

    // 颜色
    color = '';
    danmakuPush (danmaku: DanmakuDataType | DanmakuDataType[], top?: boolean) {
      const list = danmaku instanceof Array ? danmaku : [danmaku]
      list.forEach(ele => {
        if (!top) { this.danmakuDataList.push(ele) } else { this.danmakuDataList.unshift(ele) }
      })
    }

    private sending = false;
    private async sendDanmaku () {
      const player = this.player
      const danmaku = this.danmaku && this.danmaku.trim()
      if (!danmaku) { return }
      // 冷却中
      if (this.sending) { return }
      try {
        this.sending = true
        const data: DanmakuDataType = {
          msg: danmaku, color: this.color,
          pos: player.ended() ? 0 : parseInt(player.currentTime() * 1000 as any)
        }
        let sendSuccess = false
        if (this.options.danmaku.sendFn) { sendSuccess = await this.options.danmaku.sendFn(data) } else {
          this.danmakuPush(data)
          sendSuccess = true
        }
        if (sendSuccess) {
          this.player.trigger(DanmakuPlayer.Event.danmakuSend, data)
          this.danmaku = ''
        }
      } finally {
        this.sending = false
      }
    }

    private addDanmaku (danmaku: DanmakuDataTypeInner | DanmakuDataTypeInner[]) {
      const list = danmaku instanceof Array ? danmaku : [danmaku]
      list.forEach(ele => {
        ele.add = true
      })
      this.danmakuList = [
        ...this.danmakuList,
        ...list
      ]
      this.updateDanmaku()
    }

    private getTransOption (danmakuWidth) {
      const speed = 1
      const duration = danmakuWidth * 10 / speed
      return {
        translateX: -danmakuWidth,
        duration
      }
    }

    private updateDanmaku (pause?: boolean) {
      const width = this.danmakuBoard.offsetWidth
      const height = this.danmakuBoard.offsetHeight
      const transXReg = /\.*translateX\((.*)px\)/i
      const { danmakuList } = this
      danmakuList.forEach((ele, idx) => {
        let dom = ele.dom
        // 创建dom
        if (!dom) {
          const cls = ['danmaku']
          if (ele.isSelf) { cls.push('danmaku-self') }
          ele.dom = dom = videojs.dom.createEl('div', {
            className: getClsName(clsPrefix, ...cls),
            innerText: ele.msg
          }, {
            style: `color: ${ele.color};left: ${width}px`
          }) as any
          this.danmakuBoard.appendChild(dom)
        }
        // 计算高度,移动动画
        if (!ele.animeInst) {
          const topLevelDict = { 0: 0 }
          danmakuList.forEach((ele2, idx2) => {
            const dom2 = ele2.dom
            if (idx != idx2 && dom2) {
              const x = Math.abs(parseFloat(transXReg.exec(dom2.style.transform)[1]))
              if (!isNaN(x) && x < dom2.offsetWidth) {
                const top = dom2.offsetTop
                if (!topLevelDict[top]) { topLevelDict[top] = 0 }
                topLevelDict[top]++
                let newTop = dom2.offsetHeight + dom2.offsetTop
                if (newTop + dom.offsetHeight >= height) { newTop = 0 }
                if (!topLevelDict[newTop]) { topLevelDict[newTop] = 0 }
              }
            }
          })
          const danmakuWidth = width + dom.offsetWidth + 5
          let top = 0
          let minLevel = -1
          for (const key in topLevelDict) {
            const level = topLevelDict[key]
            if (minLevel < 0 || level < minLevel) {
              minLevel = level
              top = parseFloat(key)
            }
          }
          if (top) { dom.style.top = top + 'px' }
          ele.animeInst = anime({
            targets: dom,
            easing: 'linear',
            ...this.getTransOption(danmakuWidth)
          })
          if (pause) {
            ele.animeInst.pause()
          }
          ele.animeInst.finished.then(() => {
            ele.finished = true
          })
        }
      })
    }

    dispose () {
      this.player.dispose()
      this.unbindEvent()
    }

    private unbindEvent () {
      window.removeEventListener('resize', this.resizeHandler)
    }
}
