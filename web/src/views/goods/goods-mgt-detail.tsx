import { Component, Vue, Watch } from 'vue-property-decorator'
import * as iview from 'iview'

import { dev, myEnum, authority } from '@/config'
import { testApi } from '@/api'
import { routerConfig } from '@/router'
import * as helpers from '@/helpers'
import { Form, FormItem, Input, Row, Col, Button, Divider, RadioGroup, Radio, DatePicker, Table, Select, Option, Checkbox } from '@/components/iview'
import { MyLoad } from '@/components/my-load'
import { MyUpload, FileDataType, IMyUpload, FileType } from '@/components/my-upload'

import { Base } from '../base'
import { GoodsDetailMainView } from './goods-detail'

import './goods.less'

export type DetailType = {
    spu: SpuType;
    sku: SkuType[];
    specGroup: SpecGroupType[];
    saveSku?: any[];
};
export type SpuType = {
    _id?: string;
    name: string;
    profile: string;
    imgs: string[];
    imgUrls: any[];
    status: number;
    statusText: string;
    putOnAt: Date;
    expireAt: Date;

    price?: number;
    saleQuantity?: number;
};
type SpecGroupType = { name: string, value: string[] };
export type SkuType = {
    _id: string;
    name: string;
    spec: string[];
    status: number;
    price: number;
    quantity: number;
    saleQuantity: number;
    imgs: string[];
    imgUrls: any[];
};

@Component
export default class GoodsMgtDetail extends Base {
    stylePrefix = 'goods-mgt-'
    $refs: { formVaild: iview.Form, imgs: IMyUpload };
    private innerDetail: DetailType = this.getDetailData();
    private oldDetail: DetailType = helpers.clone(this.innerDetail);
    private preview = false;
    private skuStatusList = myEnum.goodsSkuStatus.toArray().map(e => e.value);
    protected getDetailData () {
      const data = {
        spu: {
          name: '',
          profile: '',
          imgs: [],
          imgUrls: [],
          status: myEnum.goodsStatus.上架,
          statusText: '',
          putOnAt: null,
          expireAt: null
        },
        specGroup: [{
          name: '款式',
          value: ['款式1']
        }],
        sku: []
      }
      data.spu.statusText = myEnum.goodsStatus.getKey(data.spu.status)
      return data
    }

    private async loadDetailData () {
      const query = this.$route.query
      let detail: DetailType
      if (query._id) {
        this.preview = this.$route.path == routerConfig.goodsMgtDetail.path
        detail = await testApi.goodsMgtDetailQuery({ _id: query._id })
        if (!this.preview) {
          const { spu } = detail
          if (spu.putOnAt) { spu.putOnAt = new Date(spu.putOnAt) }
          if (spu.expireAt) { spu.expireAt = new Date(spu.expireAt) }
          spu.imgUrls = spu.imgUrls.map((ele, idx) => {
            return { url: ele, fileType: FileDataType.图片, metadata: spu.imgs[idx] }
          })
        }
        if (query.repost) {
          detail.spu._id = ''
        }
        this.skuShowSetOnly = true
      } else {
        detail = this.getDetailData() as any
      }
      detail.saveSku = []
      this.innerDetail = detail
      this.oldDetail = helpers.clone(detail)
      this.sku = detail.sku
      this.resetSku(myEnum.goodsResetType.初始化)
      this.setRules()
      return detail
    }

    rules = {};
    private setRules () {
      const spuRules = {
        name: [
          { required: true, trigger: 'blur', message: '请填写名称' }
        ],
        profile: [
          { required: true, trigger: 'blur', message: '请填写简介' }
        ]
      }
      const rules = {
        saveSku: [
          { type: 'array', required: true, trigger: 'blur', message: '请设置sku' }
        ]
      }
      for (const key in spuRules) {
        rules['spu.' + key] = spuRules[key]
      }
      this.rules = rules
    }

    saving = false;
    async save () {
      await this.operateHandler('提交', async () => {
        this.saving = true
        const { spu, specGroup, saveSku } = this.innerDetail
        const { imgUrls, ...restSpu } = spu

        await this.$refs.imgs.upload()
        restSpu.imgs = imgUrls.map((ele: FileType) => ele.metadata)
        const saveData = {
          spu: restSpu,
          specGroup,
          sku: saveSku
        }
        await testApi.goodsMgtSave(saveData)
      }, {
        beforeValid: () => {
          this.innerDetail.saveSku = this.sku.filter(ele => this.skuStatusList.includes(ele.status)).map(ele => {
            const { imgUrls, ...restSku } = ele
            return restSku
          })
        },
        validate: this.$refs.formVaild.validate,
        onSuccessClose: () => {
          this.$router.push(routerConfig.goodsMgt.path)
        }
      }).finally(() => {
        this.saving = false
      })
    }

    protected render () {
      return (
        <div>
          <MyLoad
            loadFn={this.loadDetailData}
            renderFn={(detail: DetailType) => {
              if (!this.preview) { return this.renderEdit() }
              return <GoodsDetailMainView data={detail} />
            }}
          />
        </div>
      )
    }

    private renderEdit () {
      const detail = this.innerDetail
      const { spu } = detail
      return (
        <div>
          <Form ref='formVaild' label-position='top' props={{ model: detail }} rules={this.rules}>
            <FormItem label='名称' prop='spu.name'>
              <Input v-model={spu.name} />
            </FormItem>
            <FormItem label='简介' prop='spu.profile'>
              <Input v-model={spu.profile} type='textarea' />
            </FormItem>
            <FormItem label='状态' prop='spu.status'>
              <RadioGroup v-model={spu.status}>
                {myEnum.goodsStatus.toArray().filter(s => s.value !== myEnum.goodsStatus.已删除).map(s => {
                  return <Radio label={s.value}>{s.key}</Radio>
                })}
              </RadioGroup>
            </FormItem>
            <FormItem label='上架时间' prop='spu.putOnAt'>
              <DatePicker v-model={spu.putOnAt} options={{
                disabledDate: (date?) => {
                  return date && date.valueOf() < Date.now()
                }
              }} />
            </FormItem>
            <FormItem label='失效时间' prop='spu.expireAt'>
              <DatePicker v-model={spu.expireAt} options={{
                disabledDate: (date?) => {
                  return date && date.valueOf() < Date.now()
                }
              }} />
            </FormItem>
            <FormItem label='图片' prop='spu.imgs'>
              <MyUpload
                ref='imgs'
                headers={testApi.defaultHeaders}
                uploadUrl={testApi.imgUploadUrl}
                successHandler={(res, file) => {
                  const rs = testApi.uplodaHandler(res)
                  file.url = rs.url
                  file.metadata = rs.fileId
                  return rs.fileId
                }}
                format={['jpg', 'jpeg', 'png']}
                width={160} height={90}
                v-model={spu.imgUrls}
                maxCount={4}
              />
            </FormItem>
            <Divider size='small'>规格</Divider>
            <Button
              class={this.getStyleName('reset-spec')}
              on-click={() => {
                this.innerDetail.specGroup = helpers.clone(this.oldDetail.specGroup)
                this.sku = helpers.clone(this.oldDetail.sku)
                this.resetSku(myEnum.goodsResetType.初始化)
              }}>重置规格</Button>
            {this.renderSpecGroup()}
            <Divider size='small'>sku</Divider>
            <FormItem label='sku' prop='saveSku'>
            </FormItem>
            {this.renderSku()}
          </Form>
          <Button type='primary' loading={this.saving} on-click={() => {
            this.save()
          }}>
                    提交
          </Button>
        </div>
      )
    }

    // 渲染规格分组
    private renderSpecGroup () {
      const { specGroup } = this.innerDetail
      return specGroup.map((g, gIdx) => {
        const groupProp = `specGroup.${gIdx}`
        return (
          <div>
            <Row>
              <Col xs={20} sm={10}>
                <FormItem label={'规格' + (gIdx + 1)} prop={groupProp + '.name'}
                  rules={{
                    required: true, trigger: 'blur',
                    message: '请填写规格名'
                  }}
                >
                  <div class={this.getStyleName('spec-group')}>
                    <Input v-model={g.name} on-on-change={() => {
                      this.setSkuCol()
                    }} />
                    <Button type='primary' shape='circle' icon='md-add'
                      on-click={() => {
                        specGroup.splice(gIdx + 1, 0, { name: '', value: [''] })
                        this.resetSku(myEnum.goodsResetType.规格数量)
                      }}
                    />
                    {specGroup.length > 1 && <Button type='error' shape='circle' icon='md-remove'
                      on-click={() => {
                        specGroup.splice(gIdx, 1)
                        this.resetSku(myEnum.goodsResetType.规格数量)
                      }}
                    />}
                  </div>
                </FormItem>
              </Col>
            </Row>
            <Row>
              {g.value.map((v, vIdx) => {
                return (
                  <Col xs={24} sm={12}>
                    <FormItem prop={groupProp + '.value.' + vIdx}
                      rules={{
                        required: true, trigger: 'blur',
                        message: '请填写值'
                      }}
                    >
                      <div class={this.getStyleName('spec-group')}>
                        <Input v-model={g.value[vIdx]} on-on-change={() => {
                          this.resetSku(myEnum.goodsResetType.规格值)
                        }} />
                        <Button type='primary' shape='circle' icon='md-add'
                          on-click={() => {
                            g.value.splice(vIdx + 1, 0, '')
                            this.resetSku(myEnum.goodsResetType.规格数量)
                          }}
                        />
                        {g.value.length > 1 && <Button type='error' shape='circle' icon='md-remove'
                          on-click={() => {
                            g.value.splice(vIdx, 1)
                            this.resetSku(myEnum.goodsResetType.规格数量)
                          }}
                        />}
                      </div>
                    </FormItem>
                  </Col>
                )
              })}
            </Row>
            {gIdx < specGroup.length - 1 && <Divider size='small' />}
          </div>
        )
      })
    }

    private sku: SkuType[] = [];
    private skuCol = [];
    private createSku (specIdx: number, list: SkuType[] = [], spec?: string[]) {
      const { specGroup } = this.innerDetail
      if (specGroup.length == 0) { return [] }

      specGroup[specIdx].value.forEach(ele => {
        if (specIdx == 0) { spec = [] }
        const lastLv = specIdx + 1 === specGroup.length
        if (!lastLv) { spec.push(ele) }
        if (specIdx + 1 < specGroup.length) { this.createSku(specIdx + 1, list, spec) } else if (lastLv) {
          const currSpec = [...spec, ele]

          let match
          // 按index匹配
          if (this.skuResetType === myEnum.goodsResetType.规格值) {
            match = this.sku[list.length]
          } else {
            let matchLength = 0
            let matchIdx = 0
            this.sku.forEach((s, sIdx) => {
              for (let idx = 0; idx < s.spec.length; idx++) {
                if (s.spec[idx] !== currSpec[idx]) {
                  break
                }
                const length = idx + 1
                if (s.spec[idx] === currSpec[idx] && length > matchLength) {
                  matchLength = length
                  matchIdx = sIdx
                }
              }
            })
            // 按规格值,如果不是完全一样,去掉销量,_id,status
            if ((this.skuResetType === myEnum.goodsResetType.规格数量 && matchLength > 0) ||
                        (this.skuResetType === myEnum.goodsResetType.初始化 && matchLength === currSpec.length)) {
              match = { ...this.sku[matchIdx] }
              if (matchLength !== currSpec.length) {
                delete match._id
                delete match.saleQuantity
                delete match.status
              }
            }
          }
          if (!match) { match = {} }
          list.push({
            quantity: 0,
            price: 0,
            saleQuantity: 0,
            imgs: [],
            imgUrls: [],
            status: null,
            ...match,
            spec: currSpec
          })
        }
      })
      return list
    }

    private setSkuCol () {
      const { specGroup } = this.innerDetail
      this.skuCol = [...specGroup.map((ele, idx) => {
        return {
          title: ele.name,
          key: 'specGroup' + idx,
          render: (h, params) => {
            return (
              <span>{this.sku[params.index].spec[idx]}</span>
            )
          }
        }
      }), {
        title: '价格',
        key: 'price',
        render: (h, params) => {
          return (
            <Input v-model={this.sku[params.index].price} type='number' />
          )
        }
      }, {
        title: '数量',
        key: 'quantity',
        render: (h, params) => {
          return (
            <Input v-model={this.sku[params.index].quantity} type='number' />
          )
        }
      }, {
        title: '销量',
        key: 'saleQuantity'
      }, {
        title: '状态',
        key: 'status',
        render: (h, params) => {
          const detail = params.row
          return (
            <Select v-model={this.sku[params.index].status} clearable placeholder='不设置'>
              {myEnum.goodsSkuStatus.toArray().map(ele => {
                return <i-option value={ele.value} key={ele.value}>{ele.key}</i-option>
              })}
            </Select>
          )
        }
      }]
    }

    private skuResetType;
    private resetSku (type) {
      this.setSkuCol()
      this.skuResetType = type
      this.sku = this.createSku(0)
    }

    private skuShowSetOnly = false;
    private renderSku () {
      return (
        <div class={this.getStyleName('sku-main')}>
          <label><Checkbox v-model={this.skuShowSetOnly} />仅显示已设置</label>
          <Table
            row-class-name={this.rowClassName}
            columns={this.skuCol}
            data={this.sku}
          />
        </div>
      )
    }

    private rowClassName (row, index) {
      if (!this.skuShowSetOnly ||
            (this.skuStatusList.includes(row.status))) { return '' }
      return 'hidden'
    }
}
