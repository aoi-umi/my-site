import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop } from '@/components/decorator'
import { Button, Divider, Modal } from '@/components/iview'
import { MyWaterfall } from '@/components/my-waterfall'
import { testApi } from '@/api'

import { Base } from './base'
@Component
export default class ImgMgt extends Base {
  $refs: { root: HTMLDivElement; waterFall: MyWaterfall };
  stylePrefix = 'img-mgt';
  imgsArr = [];

  page = 1;
  rows = 10;
  async getData () {
    const rs = await testApi.myImgQuery({ page: this.page, rows: this.rows })
    const finished = rs.total == ((this.page - 1) * this.rows + rs.rows.length)
    this.page++
    return {
      data: rs.rows.map(ele => ({
        src: ele.url,
        data: ele
      })),
      finished
    }
  }

  selectable = false;
  private cancel () {
    this.selectable = false
  }
  private get deletable () {
    return this.$refs.waterFall && this.$refs.waterFall.itemList.filter(ele => ele.selected).length > 0
  }
  private async del () {
    const waterFall = this.$refs.waterFall
    const idList = []
    let idxList = []
    waterFall.itemList.forEach((ele, idx) => {
      if (ele.selected) {
        idxList.push(idx)
        idList.push(ele.data.data._id)
      }
    })
    await testApi.myImgDel({ idList })
    waterFall.removeItem(idxList)
    this.cancel()
  }

  render () {
    return (
      <div class='button-group-normal'>
        <Button type='error' disabled={this.selectable && !this.deletable} on-click={() => {
          if (!this.selectable) {
            this.selectable = true
          } else {
            this.$utils.confirm(`确认删除?`, {
              ok: this.del,
              cancel: this.cancel
            })
          }
        }}>删除</Button>
        {this.selectable && <Button on-click={() => {
          this.cancel()
        }}>取消</Button>}
        <Divider />
        <MyWaterfall
          ref='waterFall'
          selectable={this.selectable}
          getDataFn={() => {
            return this.getData()
          }}
          maskContentRenderFn={(item) => {
            return <div>{item.data.filename}</div>
          }}
        />
      </div>
    )
  }
}
