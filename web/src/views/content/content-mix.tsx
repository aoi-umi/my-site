import { Watch } from 'vue-property-decorator'

import { Component, Vue, Prop } from '@/components/decorator'
import { myEnum, authority, dev } from '@/config'
import { Card } from '@/components/iview'

import { ArticleListItem } from './article'
import { VideoListItem } from './video'

class ContentMixItemProp {
    @Prop({
      required: true
    })
    value: any;
}
@Component({
  props: ContentMixItemProp
})
export class ContentMixItem extends Vue<ContentMixItemProp> {
  render () {
    const ele = this.value
    if (ele.contentType === myEnum.contentType.文章) { return <ArticleListItem value={ele} /> }
    if (ele.contentType === myEnum.contentType.视频) { return <VideoListItem value={ele} /> }
    return <Card>错误的类型</Card>
  }
}
