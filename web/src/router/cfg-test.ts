
let prefix = '/test'
export default {

  test: {
    path: prefix,
    text: '测试',
    component: () => import('../views/_test/demo')
  },
  testDockPanel: {
    path: `${prefix}/dockpanel`,
    text: '测试',
    component: () => import('../views/_test/dock-panel')
  },
  waterfall: {
    path: `${prefix}/waterfall`,
    text: '瀑布流',
    component: () => import('../views/_test/waterfall')
  },
  dynamicComp: {
    path: `${prefix}/dynamicComp`,
    text: '动态组件',
    component: () => import('../views/_test/dynamic-comp')
  }
}
