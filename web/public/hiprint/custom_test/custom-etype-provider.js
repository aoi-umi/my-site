let customElementTypeProvider = (function () {
  return function (options) {
    let addElementTypes = function (context) {
      context.addPrintElementTypes(
        'testModule',
        [
          new hiprint.PrintElementTypeGroup('常规', [
            { tid: 'testModule.text', text: '文本', data: '', type: 'text' },
            { tid: 'testModule.image', text: '图片', data: '/hiprint/hi.png', type: 'image',
              options: {
                width: 160,
                height: 90
              }
            },
            { tid: 'testModule.longText', text: '长文', data: '', type: 'longText' },
            {
              tid: 'testModule.table', field: 'table', text: '表格',
              type: 'table',
              groupFields: ['name'],
              groupFooterFormatter: function (group, option) {
                return '这里自定义统计脚信息'
              },
              columnDisplayEditable: true, // 列显示是否能编辑
              columnDisplayIndexEditable: true, // 列顺序显示是否能编辑
              columnTitleEditable: true, // 列标题是否能编辑
              columnResizable: true, // 列宽是否能调整
              columnAlignEditable: true, // 列对齐是否调整
              columns: [
                [{
                  'title': '标题',
                  'field': 'title'
                }]
              ]
            },
            {
              tid: 'testModule.tableCustom',
              title: '表格',
              type: 'tableCustom'
            },
            {
              tid: 'testModule.html', title: 'html',
              formatter: function (data, options) {
                return $('<div style="height:50pt;width:50pt;background:red;border-radius: 50%;"></div>')
              },
              type: 'html'
            },
            { tid: 'testModule.customText', text: '自定义文本', customText: '自定义文本', custom: true, type: 'text' }
          ]),
          new hiprint.PrintElementTypeGroup('辅助', [
            {
              tid: 'testModule.hline',
              text: '横线',
              type: 'hline'
            },
            {
              tid: 'testModule.vline',
              text: '竖线',
              type: 'vline'
            },
            {
              tid: 'testModule.rect',
              text: '矩形',
              type: 'rect'
            },
            {
              tid: 'testModule.oval',
              text: '椭圆',
              type: 'oval'
            }
          ])
        ]
      )
    }

    return {
      addElementTypes: addElementTypes
    }
  }
})()
