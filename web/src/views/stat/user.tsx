import { Component, Vue, Watch } from 'vue-property-decorator'
import * as echarts from 'echarts'

import { testSocket, testApi } from '@/api'
import { Divider } from '@/components/iview'

import { Base } from '../base'
import './user.less'

@Component
export default class StatUser extends Base {
    stylePrefix = 'stat-user-';
    $refs: {
        echart: HTMLDivElement;
        pv: HTMLDivElement;
    };
    chart: echarts.ECharts;
    pv: echarts.ECharts;
    total = { ip: 0, pv: 0, uv: 0 };

    mounted () {
      this.chart = echarts.init(this.$refs.echart)
      this.pv = echarts.init(this.$refs.pv)
      this.statQuery()
    }

    statQuery () {
      this.operateHandler('获取数据', async () => {
        const data = await testApi.statQuery()
        this.total = data.total
        const recently = data.recently
        const series = []; const pvSeries = []
        Object.entries(recently.data).forEach(obj => {
          const key = obj[0]; const ele = obj[1]
          const o = {
            name: key,
            type: 'line',
            data: ele
          }
          if (key === 'pv') { pvSeries.push(o) } else { series.push(o) }
        })
        const optionData: any = {
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'cross',
              label: {
                backgroundColor: '#6a7985'
              }
            }
          },
          xAxis: {
            type: 'category',
            data: recently.date
          },
          yAxis: {
            type: 'value'
          }
        }

        this.chart.setOption({
          ...optionData,
          title: {
            text: 'ip, uv'
          },
          series
        })
        this.pv.setOption({
          ...optionData,
          title: {
            text: 'pv'
          },
          series: pvSeries
        })
      }, {
        noSuccessHandler: true
      })
    }

    render () {
      return (
        <div>
          <div class={this.getStyleName('total')}>
            <div>总览</div>
            <div class={this.getStyleName('total-content')}>
              {Object.entries(this.total).map(ele => {
                return (
                  <div>
                    <span>{ele[0]}:</span>
                    <span>{ele[1]}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <Divider />
          <div class={this.getStyleName('chart-box')}>
            <div ref='echart'></div>
            <div ref='pv'></div>
          </div>
        </div>
      )
    }
}
