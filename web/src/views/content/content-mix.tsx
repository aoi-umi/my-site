import { Component, Vue, Watch } from 'vue-property-decorator'

import { Prop } from '@/components/property-decorator'
import { myEnum, authority, dev } from '@/config'
import { getCompOpts, convClass } from '@/components/utils'
import { Card } from '@/components/iview'
import { ArticleListItemView } from './article'
import { VideoListItemView } from './video'

class ContentMixItemProp {
    @Prop({
      required: true
    })
    value: any;
}
@Component({
  mixins: [getCompOpts(ContentMixItemProp)]
})
class ContentMixItem extends Vue<ContentMixItemProp> {
  render () {
    const ele = this.value
    if (ele.contentType === myEnum.contentType.文章) { return <ArticleListItemView value={ele} /> }
    if (ele.contentType === myEnum.contentType.视频) { return <VideoListItemView value={ele} /> }
    return <Card>错误的类型</Card>
  }
}

export const ContentMixItemView = convClass<ContentMixItemProp>(ContentMixItem)
