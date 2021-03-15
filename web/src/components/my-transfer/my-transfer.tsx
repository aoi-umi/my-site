import { Component, Vue, Watch } from 'vue-property-decorator'

import { Prop } from '@/components/property-decorator'

import { convClass, getCompOpts } from '../utils'
import { Button, Transfer } from '../iview'
import { MyBase } from '../my-base'

import './style.less'

type DataType = {
    key: string;
    label: string;
    data: any;
    disabled?: boolean;
};

class MyTransferProp {
    @Prop()
    selectedData: DataType[];

    @Prop()
    getDataFn: () => DataType[] | Promise<DataType[]>;
}
@Component({
  extends: MyBase,
  mixins: [getCompOpts(MyTransferProp)]
})
class MyTransfer extends Vue<MyTransferProp & MyBase> {
    stylePrefix = 'my-transfer-';

    @Watch('selectedData')
    private updateSelectedData (newVal: DataType[]) {
      this.targetKeys = newVal ? newVal.map(ele => ele.key) : []
    }

    private data: DataType[] = [];
    private get allData () {
      const list = [...this.data]
      if (this.selectedData) {
        this.selectedData.forEach(ele => {
          if (!list.find(l => l.key == ele.key)) { list.push(ele) }
        })
      }
      return list
    }

    getChangeData (key?: string) {
      let addList: any[] = this.data.filter(e => this.targetKeys.includes(e.key) && !this.selectedData.find(s => s.key == e.key))
      let delList: any[] = this.selectedData.filter(e => !this.targetKeys.includes(e.key))
      if (key) {
        addList = addList.map(ele => ele[key])
        delList = delList.map(ele => ele[key])
      }
      return {
        addList,
        delList
      }
    }
    private targetKeys = [];
    private loading = false;

    async loadData () {
      this.loading = true
      try {
        this.data = await this.getDataFn()
      } catch (e) {
        this.$Message.error(e.message)
      } finally {
        this.loading = false
      }
    }
    protected render () {
      return (
        <Transfer
          data={this.allData}
          targetKeys={this.targetKeys}
          filterable={true as any}
          filter-method={(d, query?) => {
            const data = d as any as { data: any; key: string; label: string }
            return data.label.toLocaleLowerCase().indexOf(query.toLocaleLowerCase()) > -1
          }}
          titles={['未添加', '已添加']}
          on-on-change={(targetKeys, direction, moveKeys) => {
            this.targetKeys = targetKeys
          }}
        >
          <div class={this.getStyleName('refresh')}>
            <Button size='small' on-click={this.loadData} loading={this.loading}>刷新</Button>
          </div>
        </Transfer>
      )
    }
}

export interface IMyTransfer extends MyTransfer { }
const MyTransferView = convClass<MyTransferProp>(MyTransfer)
export default MyTransferView
