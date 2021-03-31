import { Component, Vue, Watch } from 'vue-property-decorator'
import * as echarts from 'echarts'

import { testSocket, testApi } from '@/api'
import { Divider } from '@/components/iview'

import { Base } from '../base'
import './user.less'

@Component
export default class StatUser extends Base {
  stylePrefix = 'stat-user-';
  $refs: {};
  total = { ip: 0, pv: 0, uv: 0 };

  echartsObj: { [key: string]: echarts.ECharts } = {}
  mounted () {
    ['ip', 'pv', 'pvPie'].forEach(key => {
      this.echartsObj[key] = echarts.init(this.$refs[key])
    })
    this.statQuery()
  }

  statQuery () {
    this.operateHandler('获取数据', async () => {
      const data = await testApi.statQuery()
      this.total = data.total
      const { recently, pvStat } = data
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

      this.echartsObj.ip.setOption({
        ...optionData,
        title: {
          text: 'ip, uv'
        },
        series
      })
      this.echartsObj.pv.setOption({
        ...optionData,
        title: {
          text: 'pv'
        },
        series: pvSeries
      })

      this.echartsObj.pvPie.setOption({
        title: {
          text: `pv前${pvStat.n}统计`,
          subtext: '',
          left: 'center'
        },
        tooltip: {
          trigger: 'item'
        },
        legend: {
          top: '10%',
          left: 'center',
          show: false
        },
        series: [
          {
            name: `pv前${pvStat.n}统计`,
            type: 'pie',
            radius: ['30%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 40,
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: pvStat.data.map(ele => {
              return {
                name: ele._id,
                value: ele.times
              }
            })
          }
        ]
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
          <div ref='ip'></div>
          <div ref='pv'></div>
          <div ref='pvPie'></div>
        </div>
      </div>
    )
  }
}
