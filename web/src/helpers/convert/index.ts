import { EnumInstance } from 'enum-ts'

import { MyListModel } from '@/components/my-list'

export * from './xml'

export class Test {
  // query参数与列表model之间的转换
  static queryToListModel (query: any, model: MyListModel) {
    model.setPage({ index: query.page, size: query.rows })
    const sort = { 1: 'asc', '-1': 'desc' }
    model.setSort({ orderBy: query.orderBy, sortOrder: sort[query.sortOrder as any] })
  }

  static listModelToQuery (model: MyListModel) {
    return {
      page: model.page.index,
      rows: model.page.size,
      orderBy: model.sort.orderBy,
      sortOrder: model.sort.sortOrder
    }
  }
}

export class ViewModel {
  static enumToTagArray (en: EnumInstance<any, any>) {
    return en.toArray().map(ele => {
      return {
        tag: ele.key,
        key: ele.value,
        checkable: true
      }
    })
  }
}
