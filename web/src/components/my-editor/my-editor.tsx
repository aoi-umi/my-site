import { Component, Vue, Watch } from 'vue-property-decorator'
import { quillEditor } from 'vue-quill-editor'
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import 'quill/dist/quill.bubble.css'

import marked from 'marked'

import { Prop } from '@/components/property-decorator'
import { Input, RadioGroup, Radio, Row, Col } from '../iview'
import { convClass, getCompOpts } from '../utils'
import { MyInputBase, MyInputBaseProp } from '../my-input/my-input'

import './style.less'

const ContentType = {
  default: 0,
  markdown: 1
}

class MyEditorProp extends MyInputBaseProp {
    @Prop({
      default: () => {
        return [
          ['bold', 'italic', 'underline', 'strike'], // toggled buttons
          ['blockquote', 'code-block'],

          [{ 'header': 1 }, { 'header': 2 }], // custom button values
          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
          [{ 'script': 'sub' }, { 'script': 'super' }], // superscript/subscript
          [{ 'indent': '-1' }, { 'indent': '+1' }], // outdent/indent
          [{ 'direction': 'rtl' }], // text direction

          [{ 'size': ['small', false, 'large', 'huge'] }], // custom dropdown
          [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

          [{ 'color': [] }, { 'background': [] }], // dropdown with defaults from theme
          [{ 'font': [] }],
          [{ 'align': [] }],
          ['link', 'image']// 'formula','video'
        ]
      }
    })
    toolbar?: any[][];

    @Prop({
      default: ContentType.default
    })
    type?: number;

    @Prop()
    defaultOnly?: boolean;
}
@Component({
  extends: MyInputBase,
  mixins: [getCompOpts(MyEditorProp)],
  quillEditor
})
class MyEditor extends Vue<MyEditorProp & MyInputBase> {
    stylePrefix = 'my-editor-';

    $refs: { quillEditor: any };

    private toolbarTips: { choice: string; title: string }[] = [
      { choice: '.ql-bold', title: '加粗' },
      { choice: '.ql-italic', title: '倾斜' },
      { choice: '.ql-underline', title: '下划线' },
      { choice: '.ql-header', title: '段落格式' },
      { choice: '.ql-strike', title: '删除线' },
      { choice: '.ql-blockquote', title: '块引用' },
      { choice: '.ql-code-block', title: '插入代码段' },
      { choice: '.ql-size', title: '字体大小' },
      { choice: '.ql-header[value="1"]', title: 'h1' },
      { choice: '.ql-header[value="2"]', title: 'h2' },
      { choice: '.ql-list[value="ordered"]', title: '编号列表' },
      { choice: '.ql-list[value="bullet"]', title: '项目列表' },
      { choice: '.ql-script[value="sub"]', title: '下标' },
      { choice: '.ql-script[value="super"]', title: '上标' },
      { choice: '.ql-align', title: '对齐方式' },
      { choice: '.ql-color', title: '字体颜色' },
      { choice: '.ql-background', title: '背景颜色' },
      { choice: '.ql-font', title: '字体' },
      { choice: '.ql-image', title: '图像' },
      { choice: '.ql-video', title: '视频' },
      { choice: '.ql-link', title: '添加链接' },
      { choice: '.ql-formula', title: '插入公式' },
      { choice: '.ql-clean', title: '清除格式' },
      { choice: '.ql-indent[value="-1"]', title: '向左缩进' },
      { choice: '.ql-indent[value="+1"]', title: '向右缩进' },
      { choice: '.ql-direction', title: 'rtl' },
      { choice: '.ql-header .ql-picker-label', title: '标题大小' },
      { choice: '.ql-header .ql-picker-item[data-value="1"]', title: '标题一' },
      { choice: '.ql-header .ql-picker-item[data-value="2"]', title: '标题二' },
      { choice: '.ql-header .ql-picker-item[data-value="3"]', title: '标题三' },
      { choice: '.ql-header .ql-picker-item[data-value="4"]', title: '标题四' },
      { choice: '.ql-header .ql-picker-item[data-value="5"]', title: '标题五' },
      { choice: '.ql-header .ql-picker-item[data-value="6"]', title: '标题六' },
      { choice: '.ql-header .ql-picker-item:last-child', title: '标准' },
      { choice: '.ql-size .ql-picker-item[data-value="small"]', title: '小号' },
      { choice: '.ql-size .ql-picker-item[data-value="large"]', title: '大号' },
      { choice: '.ql-size .ql-picker-item[data-value="huge"]', title: '超大号' },
      { choice: '.ql-size .ql-picker-item:nth-child(2)', title: '标准' },
      { choice: '.ql-align .ql-picker-item:first-child', title: '居左对齐' },
      { choice: '.ql-align .ql-picker-item[data-value="center"]', title: '居中对齐' },
      { choice: '.ql-align .ql-picker-item[data-value="right"]', title: '居右对齐' },
      { choice: '.ql-align .ql-picker-item[data-value="justify"]', title: '两端对齐' }
    ];

    private contentTypeList: any[];
    currType = this.type;
    private defaultValue = '';
    private markdownValue = '';
    private markdownPreview = '';
    @Watch('defaultValue')
    private watchDefault () {
      this.setCurrVal(this.defaultValue)
    }
    @Watch('markdownValue')
    private watchMarkdown () {
      this.markdownPreview = marked(this.markdownValue)
      this.setCurrVal(this.markdownValue)
    }
    private setCurrVal (val) {
      this.currentValue = val
    }

    private typeMap = {
      [ContentType.default]: 'defaultValue',
      [ContentType.markdown]: 'markdownValue'
    };

    @Watch('currType')
    private watchType (newType, oldType) {
      this.$data[this.typeMap[newType]] = this.$data[this.typeMap[oldType]]
    }

    created () {
      this.$data[this.typeMap[this.currType]] = this.value
      this.contentTypeList = Object.entries(ContentType).map((v) => {
        return {
          key: v[0],
          value: v[1]
        }
      })
    }
    protected mounted () {
      const el: HTMLElement = this.$refs.quillEditor.$el
      for (const ele of this.toolbarTips) {
        const elm = el.querySelector('.quill-editor ' + ele.choice)
        if (!elm) { continue }
        elm.setAttribute('title', ele.title)
      }
    }

    insertEmbed (type, data) {
      const quill = this.$refs.quillEditor.quill
      const index = quill.selection.savedRange.index
      quill.insertEmbed(index, type, data)
      quill.setSelection(index + 1)
    }

    private handleImg (toolbar) {
      let fileInput = toolbar.container.querySelector('input.ql-image[type=file]')
      if (fileInput == null) {
        fileInput = document.createElement('input')
        fileInput.setAttribute('type', 'file')
        fileInput.setAttribute('accept', 'image/png, image/gif, image/jpeg, image/bmp, image/x-icon')
        fileInput.classList.add('ql-image')
        fileInput.addEventListener('change', () => {
          if (fileInput.files != null && fileInput.files[0] != null) {
            this.$emit('img-change', fileInput.files[0])
            fileInput.value = ''
          }
        })
        toolbar.container.appendChild(fileInput)
      }
      fileInput.click()
    }

    render () {
      const self = this
      return (
        <div>
          {!this.defaultOnly && <div>
            <span>类型 </span>
            <RadioGroup v-model={this.currType}>
              {this.contentTypeList.map(ele => {
                return <Radio label={ele.value}>{ele.key}</Radio>
              })}
            </RadioGroup>
          </div>
          }
          <quillEditor v-show={this.currType === ContentType.default}
            class={this.getStyleName('editor')} ref='quillEditor'
            v-model={this.defaultValue} options={{
              placeholder: this.placeholder,
              modules: {
                toolbar: {
                  container: this.toolbar,
                  handlers: {
                    image: function () {
                      self.handleImg(this)
                    }
                  }
                }
              }
            }
            } />
          <Row gutter={10} v-show={this.currType === ContentType.markdown}>
            <Col xs={12}>
              <div class={this.getStyleName('wrap')}>
                <pre class={this.getStyleName('pre')}>{this.markdownValue}</pre>
                <Input type='textarea'
                  class={this.getStyleName('md-editor')} v-model={this.markdownValue}
                />
              </div>
            </Col>
            <Col xs={12}>
              <div class={this.getStyleName('preview')} domPropsInnerHTML={this.markdownPreview}>
              </div>
            </Col>
          </Row>
        </div>
      )
    }
}

export interface IMyEditor extends MyEditor { }
const MyEditorView = convClass<MyEditorProp>(MyEditor)
export default MyEditorView
