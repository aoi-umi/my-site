
export class MyListModel<T = any> {
  page = {
    index: 1,
    size: 10
  };
  sort = {
    orderBy: '',
    sortOrder: ''
  };
  query: T = {} as any;
  selection = []
  setPage (p: { index?: any; size?: any }) {
    if (p) {
      const index = parseInt(p.index)
      if (!isNaN(index) && index > 0) { this.page.index = index }

      const size = parseInt(p.size)
      if (!isNaN(size) && size > 0) { this.page.size = size }
    }
  }

  setSort (sort: {
    orderBy,
    sortOrder
  }) {
    this.sort.orderBy = sort.orderBy
    this.sort.sortOrder = sort.sortOrder
  }
}

export type MyListResult<T = any> = {
  total: number;
  rows: T[];
};
