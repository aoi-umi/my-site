
let prefix = '/test'
export default {

  test: {
    path: prefix,
    text: '测试',
    component: () => import('../views/_test/index'),
    children: [{
      path: `dockpanel`,
      text: 'dockpanel',
      component: () => import('../views/_test/dock-panel')
    }, {
      path: `demo`,
      text: '测试',
      component: () => import('../views/_test/demo')
    }, {
      path: `waterfall`,
      text: '瀑布流',
      component: () => import('../views/_test/waterfall')
    }, {
      path: `dynamicComp`,
      text: '动态组件',
      component: () => import('../views/_test/dynamic-comp')
    }, {
      path: `dynamicSql`,
      text: '动态数据',
      component: () => import('../views/_test/dynamic-sql')
    }]
  }
}
