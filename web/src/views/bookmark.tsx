import { Component, Vue, Watch } from 'vue-property-decorator'
import * as iview from 'iview'

import { Prop } from '@/components/property-decorator'

import { testApi } from '@/api'
import { convert } from '@/helpers'
import { convClass, getCompOpts } from '@/components/utils'
import { Tag, Modal, Input, Row, Col, Form, FormItem, Button } from '@/components/iview'
import { MyList, IMyList, Const as MyListConst, OnSortChangeOptions, MyListModel } from '@/components/my-list'
import { MyTagModel, MyTag } from '@/components/my-tag'
import { MyConfirm } from '@/components/my-confirm'
import { Base } from './base'

type DetailDataType = {
  _id?: string;
  name?: string;
  url?: string;
  tagList?: string[];
};

class BookmarkDetailProp {
  @Prop()
  detail: any;
}
@Component({
  extends: Base,
  mixins: [getCompOpts(BookmarkDetailProp)]
})
class BookmarkDetail extends Vue<BookmarkDetailProp & Base> {
  tag = '';
  tagModel = new MyTagModel();

  @Watch('detail')
  updateDetail (newVal) {
    const data = newVal || this.getDetailData()
    this.initDetail(data)
  }
  private innerDetail: DetailDataType = {};
  private getDetailData () {
    return {
      _id: '',
      name: '',
      url: '',
      tagList: []
    }
  }

  private initDetail (data) {
    this.innerDetail = data
    this.tag = ''
    this.tagModel.initTag(this.innerDetail.tagList)
  }

  private rules = {
    name: [
      { required: true, trigger: 'blur' }
    ],
    url: [
      { required: true, trigger: 'blur' }
    ]
  };

  $refs: { formVaild: iview.Form };

  addTag () {
    const tag = this.tag?.trim()
    if (tag) {
      this.tagModel.addTag(tag)
      this.tag = ''
    }
  }

  saving = false;
  async handleSave () {
    await this.operateHandler('保存', async () => {
      this.saving = true
      const detail = this.innerDetail
      const { addTagList, delTagList } = this.tagModel.getChangeTag('key')
      const rs = await testApi.bookmarkSave({
        _id: detail._id,
        name: detail.name,
        url: detail.url,
        addTagList,
        delTagList
      })
      this.$emit('save-success', rs)
      this.initDetail(this.getDetailData())
    }, {
      validate: this.$refs.formVaild.validate
    }
    ).finally(() => {
      this.saving = false
    })
  }

  render () {
    const detail = this.innerDetail
    return (
      <div>
        <h3>{detail._id ? '修改' : '新增'}</h3>
        <br />
        <Form ref='formVaild' label-position='top' props={{ model: detail }} rules={this.rules}>
          <FormItem label='名字' prop='name'>
            <Input v-model={detail.name} />
          </FormItem>
          <FormItem label='url' prop='url'>
            <Input v-model={detail.url} />
          </FormItem>
          <FormItem label='标签' >
            <MyTag value={this.tagModel.tagList} />
            <br />
            <Row gutter={10}>
              <Col span={12}>
                <Input placeholder='回车或点击按钮添加' v-model={this.tag} on-on-enter={this.addTag} />
              </Col>
              <Col span={4}><Button on-click={this.addTag}>添加</Button></Col>
            </Row>
          </FormItem>
          <FormItem>
            <Button type='primary' on-click={() => {
              this.handleSave()
            }} loading={this.saving}>保存</Button>
          </FormItem>
        </Form>
      </div >
    )
  }
}

const BookmarkDetailView = convClass<BookmarkDetailProp>(BookmarkDetail)

@Component
export default class Bookmark extends Base {
  detailShow = false;
  detail: any;
  $refs: { list: IMyList<any> };

  mounted () {
    this.query()
  }

  @Watch('$route')
  route (to, from) {
    this.query()
  }

  query () {
    const list = this.$refs.list
    const query = this.$route.query
    list.setQueryByKey(query, ['name', 'url', 'anyKey'])
    convert.Test.queryToListModel(query, list.model)
    this.$refs.list.query(query)
  }

  delHandler (delIds: any[]) {
    this.$utils.confirm((
      <div>
      将要删除{delIds.length}项
      </div>
    ), {
      title: '确认删除?',
      confirm: async () => {
        await testApi.bookmarkDel({ idList: delIds })
        this.query()
      }
    })
  }

  protected render () {
    return (
      <div>
        <Modal v-model={this.detailShow} footer-hide mask-closable={false}>
          <BookmarkDetailView detail={this.detail} on-save-success={() => {
            this.detailShow = false
            this.$refs.list.query()
          }} />
        </Modal>
        <MyList
          ref='list'
          queryArgs={{
            name: {
              label: '名字'
            },
            url: {},
            anyKey: {
              label: '任意字'
            }
          }}
          columns={[{
            key: '_selection',
            type: 'selection',
            width: 60,
            align: 'center'
          }, {
            key: '_expand',
            type: 'expand',
            width: 30,
            render: (h, params) => {
              const tagList = params.row.tagList
              return <MyTag value={tagList} />
            }
          }, {
            title: '名字',
            key: 'name',
            sortable: 'custom',
            minWidth: 120
          }, {
            title: 'url',
            key: 'url',
            sortable: true,
            minWidth: 200,
            render: (h, params) => {
              return (<a target='_blank' href={params.row.url}>{params.row.url}</a>)
            }
          }, {
            title: '操作',
            key: 'action',
            fixed: 'right',
            width: 120,
            render: (h, params) => {
              return (
                <div class={MyListConst.clsActBox}>
                  <a on-click={() => {
                    this.detail = params.row
                    this.detailShow = true
                  }}>编辑</a>
                  <a on-click={() => {
                    this.delHandler([params.row._id])
                  }}>删除</a>
                </div>
              )
            }
          }]}

          queryFn={async (data) => {
            const rs = await testApi.bookmarkQuery(data)

            rs.rows.forEach(ele => {
              if (!ele.tagList || !ele.tagList.length) { ele._disableExpand = true } else { ele._expanded = true }
            })
            return rs
          }}

          on-query={(model: MyListModel) => {
            this.$router.push({
              path: this.$route.path,
              query: {
                ...model.query,
                ...convert.Test.listModelToQuery(model)
              }
            })
          }}

          on-add-click={() => {
            this.detail = null
            this.detailShow = true
          }}

          multiOperateBtnList={[{
            text: '批量删除',
            onClick: (selection) => {
              this.delHandler(selection.map(ele => ele._id))
            }
          }]}
        ></MyList>
      </div>
    )
  }
}
