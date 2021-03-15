
import { Component, Vue, Watch } from 'vue-property-decorator'

import { MyDockPanel, MyDockPanelItem } from '@/components/my-dock-panel'
import { Base } from '../base'

@Component({})
export default class App extends Base {
  protected stylePrefix = 'test-dock-panel-';

  render () {
    return (
      <MyDockPanel style='width:100%;height:500px'>
        <MyDockPanelItem dock='top' width='30px' height='30px' style='background-color: gray;'>
          top
        </MyDockPanelItem>
        <MyDockPanelItem dock='left' width='50px' height='30px' style='background-color: rgb(145, 155, 119)'>left</MyDockPanelItem>
        <MyDockPanelItem dock='bottom' minHeight='30px' style='background-color: #bd9f9f'>
          <div>bottom</div>
          <div>bottom</div>
          <div>bottom</div>
          <div>bottom</div>
        </MyDockPanelItem>
        <MyDockPanelItem width='10px' height='10px' minHeight='10px' minWidth='10px' style='background-color: #96cac3;'>rest</MyDockPanelItem>
      </MyDockPanel>
    )
  }
}
