import { Component, Vue, Watch } from 'vue-property-decorator'

import { Prop } from '@/components/property-decorator'
import { myEnum } from '@/config'
import { Tabs, TabPane, Modal, Input } from '@/components/iview'

import ArticleMgt, { ArticleMgtView } from './article-mgt'
import VideoMgt, { VideoMgtView } from './video-mgt'

@Component
export default class ContentMgt extends Vue {
    $refs: { articleMgt: ArticleMgt, videoMgt: VideoMgt }
    tab = myEnum.contentMgtType.文章;
    mounted () {
      this.load()
    }

    @Watch('$route')
    route (to, from) {
      this.load()
    }

    async load () {
      const query = this.$route.query as any
      const queryTab = query.tab
      if (myEnum.contentMgtType.getAllValue().includes(queryTab)) {
        this.tab = queryTab
      }
      this.changeTab()
    }

    private tabLoaded = {
      article: false,
      video: false
    };

    private changeTab () {
      const tab = this.tab
      if (tab === myEnum.contentMgtType.文章 && !this.tabLoaded.article) {
        this.$refs.articleMgt.query()
        this.tabLoaded.article = true
      } else if (tab === myEnum.contentMgtType.视频 && !this.tabLoaded.video) {
        this.$refs.videoMgt.query()
        this.tabLoaded.video = true
      }
    }

    render () {
      return (
        <div>
          <Tabs v-model={this.tab} animated={false} on-on-click={(name: string) => {
            this.$router.push({
              path: this.$route.path,
              query: {
                ...this.$route.query,
                tab: name
              }
            })
          }}>
            <TabPane name={myEnum.contentMgtType.文章} label='文章管理'>
              <ArticleMgtView ref='articleMgt' notQueryOnMounted notQueryOnRoute notQueryToRoute />
            </TabPane>
            <TabPane name={myEnum.contentMgtType.视频} label='视频管理'>
              <VideoMgtView ref='videoMgt' notQueryOnMounted notQueryOnRoute notQueryToRoute />
            </TabPane>
          </Tabs>
        </div>
      )
    }
}
