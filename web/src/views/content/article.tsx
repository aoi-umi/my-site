import { Component, Vue, Watch } from 'vue-property-decorator'

import { Prop } from '@/components/property-decorator'
import { testApi } from '@/api'
import { myEnum, authority, dev } from '@/config'
import { convert } from '@/helpers'
import { convClass, getCompOpts } from '@/components/utils'
import { Card, Input } from '@/components/iview'
import { MyList, IMyList } from '@/components/my-list'

import { ListBase, ListBaseProp } from '../comps/list-base'
import { Base } from '../base'
import { DetailDataType } from './article-mgt-detail'
import { ContentListItemView } from './content'

import './article.less'

class ArticleProp extends ListBaseProp { }
@Component
export default class Article extends ListBase {
    $refs: { list: IMyList<any> };

    anyKey = '';

    query () {
      const list = this.$refs.list
      let query
      if (!this.notQueryOnRoute) {
        query = this.$route.query
        list.setQueryByKey(query, ['user', 'title'])
        this.anyKey = query.anyKey
      } else {
        query = {}
      }
      convert.Test.queryToListModel(query, list.model)
      this.$refs.list.query(query)
    }

    protected delSuccessHandler () {
      this.$refs.list.query()
    }

    protected render () {
      return (
        <div>
          <Input v-model={this.anyKey} search on-on-search={() => {
            this.$refs.list.handleQuery({ resetPage: true })
          }} />
          <MyList
            ref='list'
            hideSearchBox

            type='custom'
            customRenderFn={(rs) => {
              return rs.data.map(ele => {
                return (
                  <ArticleListItemView value={ele} />
                )
              })
            }}

            queryFn={async (data) => {
              const rs = await testApi.articleQuery({ ...data, ...this.queryOpt })
              return rs
            }}

            on-query={(model, noClear, list: IMyList<any>) => {
              const q = {
                ...model.query, anyKey: this.anyKey,
                ...convert.Test.listModelToQuery(model)
              }
              if (!this.notQueryToRoute) {
                this.$router.push({
                  path: this.$route.path,
                  query: q
                })
              } else {
                list.query(q)
              }
            }}
          >
          </MyList>
        </div >
      )
    }
}

export const ArticleView = convClass<ArticleProp>(Article)

class ArticleListItemProp {
    @Prop({
      required: true
    })
    value: DetailDataType;

    @Prop({
      default: false
    })
    selectable?: boolean;

    @Prop()
    mgt?: boolean;
}

@Component({
  extends: Base,
  mixins: [getCompOpts(ArticleListItemProp)]
})
class ArticleListItem extends Vue<ArticleListItemProp & Base> {
  render () {
    return (
      <ContentListItemView
        value={this.value}
        selectable={this.selectable}
        mgt={this.mgt}
        contentType={myEnum.contentType.文章}
        on-selected-change={(checked) => {
          this.$emit('selected-change', checked)
        }}
      >
        {this.$slots.default}
      </ContentListItemView>
    )
  }
}

export const ArticleListItemView = convClass<ArticleListItemProp>(ArticleListItem)
