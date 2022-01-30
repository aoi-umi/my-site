
const { DynamicImportCdnPlugin } = require('webpack-dynamic-import-cdn-plugin')
const path = require('path')
function resolve(dir) {
  return path.resolve(path.join(__dirname, dir))
}

let env = process.env
let isProd = env.NODE_ENV === 'production'
function getCdn(commonCfg, cfg) {
  let rs = {}
  for (let key in cfg) {
    rs[key] = {
      ...commonCfg,
      url: cfg[key]
    }
  }
  return rs
}
let cdnOpt = {
  urlPrefix: 'http://static.sellfishboy.top/cdn',
  css: {
    'view-design/dist/styles/iview.css': {
      package: 'view-design',
      version: '4.5.0',
      root: '/dist',
      url: '/styles/iview.css',
    },
    'video.js/dist/video-js.min.css': {
      package: 'video.js',
      version: '7.6.6',
      root: '/dist',
      url: '/video-js.min.css'
    },
    ...getCdn({
      package: 'quill',
      version: '1.3.7',
      root: '/dist',
    }, {
      'quill/dist/quill.core.css': '/quill.core.css',
      'quill/dist/quill.snow.css': '/quill.snow.css',
      'quill/dist/quill.bubble.css': '/quill.bubble.css',
    }),
    'highlight.js/styles/github.css': `/highlight.js@10.0.2/styles/github.css`,
    ...getCdn({
      prefix: '/'
    }, {
      'hiprint/css/hiprint.css': 'hiprint/css/hiprint.css',
      'hiprint/css/print-lock.css': 'hiprint/css/print-lock.css'
    })
  },
  js: {
    vue: {
      moduleName: 'Vue',
      package: 'vue',
      version: '2.6.10',
      root: '/dist',
      url: '/vue.min.js',
    },
    'vue-router': {
      moduleName: 'VueRouter',
      package: 'vue-router',
      version: '3.0.2',
      root: '/dist',
      url: '/vue-router.min.js',
    },
    vuex: {
      moduleName: 'Vuex',
      package: 'vuex',
      version: '3.1.0',
      root: '/dist',
      url: '/vuex.min.js',
    },
    'vue-lazyload': {
      moduleName: 'VueLazyload',
      url: `/vue-lazyload@1.3.4/vue-lazyload.js`
    },
    axios: {
      moduleName: 'axios',
      package: 'axios',
      version: '0.19.0',
      root: '/dist',
      url: `/axios.min.js`
    },
    'view-design': {
      moduleName: 'iview',
      package: 'view-design',
      version: '4.5.0',
      root: '/dist',
      url: `/iview.min.js`
    },

    'video.js': {
      moduleName: 'videojs',
      package: 'video.js',
      version: '7.6.6',
      root: '/dist',
      url: '/video.min.js',
    },
    quill: {
      moduleName: 'Quill',
      package: 'quill',
      version: '1.3.7',
      root: '/dist',
      url: '/quill.min.js',
    },
    echarts: {
      moduleName: 'echarts',
      package: 'echarts',
      version: '5.0.2',
      root: '/dist',
      url: `/echarts.min.js`
    },
    jquery: {
      moduleName: 'jQuery',
      package: 'jquery',
      version: '3.5.1',
      root: '/dist',
      url: `/jquery.min.js`
    },
    'spark-md5': {
      moduleName: 'SparkMD5',
      url: '/spark-md5@3.0.2/spark-md5.min.js'
    }
  }
}
let plugins = [
  new DynamicImportCdnPlugin(cdnOpt)
]
if (env.report) {
  let { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
  plugins.push(new BundleAnalyzerPlugin())
}

module.exports = {
  productionSourceMap: false,
  pages: {
    index: {
      // entry for the page
      entry: 'src/main.ts'
    }
  },
  configureWebpack: {
    plugins,
    externals: [],
    module: {
      rules: []
    },
    resolve: {
      alias: {
        '@public': resolve('public')
      }
    }

  },
  css: {
    extract: !isProd ? false : {
      ignoreOrder: true
    }
  }
}
