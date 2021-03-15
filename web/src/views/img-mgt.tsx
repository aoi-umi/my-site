import { Component, Vue, Watch } from 'vue-property-decorator'

import { Button, Divider, Modal } from '@/components/iview'
import { MyWaterfall, IMyWaterfallView } from '@/components/my-waterfall'
import { MyConfirm } from '@/components/my-confirm'
import { testApi } from '@/api'

import { Base } from './base'
@Component
export default class ImgMgt extends Base {
    $refs: { root: HTMLDivElement; waterFall: IMyWaterfallView };
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

    delConfirmShow = false;
    selectable = false;
    private cancel () {
      this.selectable = false
      this.delConfirmShow = false
    }
    private get deletable () {
      return this.$refs.waterFall && this.$refs.waterFall.itemList.filter(ele => ele.selected).length > 0
    }
    private async del () {
      const waterFall = this.$refs.waterFall
      const selectedList = waterFall.itemList.filter(ele => ele.selected)
      const idList = selectedList.map(ele => ele.data.data._id)
      await testApi.myImgDel({ idList })
      waterFall.removeItem(selectedList.map(ele => ele.index))
      this.cancel()
    }
    render () {
      return (
        <div class='button-group-normal'>
          <Button type='error' disabled={this.selectable && !this.deletable} on-click={() => {
            if (!this.selectable) {
              this.selectable = true
            } else {
              this.delConfirmShow = true
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
          <Modal v-model={this.delConfirmShow} footer-hide>
            <MyConfirm title='确认删除'
              loading
              cancel={() => {
                this.cancel()
              }}
              ok={() => {
                return this.del()
              }}>
            </MyConfirm>
          </Modal>
        </div>
      )
    }
}
