import { Component, Vue, Watch } from 'vue-property-decorator'
import { getErrorCfgByCode } from '@/config/error'

@Component
export default class Error extends Vue {
  protected render () {
    const data = this.$route.meta.data
    const err = getErrorCfgByCode(data.code)
    return (
      <h2 style={{ textAlign: 'center', marginTop: '20px' }}>{data.msg || (err && err.msg) || '未知错误'}</h2>
    )
  }
}
