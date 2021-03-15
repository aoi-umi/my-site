
const { DynamicImportCdnPlugin } = require('webpack-dynamic-import-cdn-plugin')
const path = require('path')
function resolve (dir) {
  return path.resolve(path.join(__dirname, dir))
}

let env = process.env
let isProd = env.NODE_ENV === 'production'
function getCdn (prefix, cfg, opt) {
  let rs = {}
  opt = { ...opt }
  for (let key in cfg) {
    rs[key] = {
      ...opt,
      url: prefix + cfg[key]
    }
  }
  return rs
}
let cdnOpt = {
  urlPrefix: 'https://cdn.jsdelivr.net/npm',
  css: {
    'iview/dist/styles/iview.css': `/iview@3.5.4/dist/styles/iview.css`,
    'video.js/dist/video-js.min.css': `/video.js@7.6.6/dist/video-js.min.css`,
    ...getCdn(`/quill@1.3.7/dist/`, {
      'quill/dist/quill.core.css': 'quill.core.css',
      'quill/dist/quill.snow.css': 'quill.snow.css',
      'quill/dist/quill.bubble.css': 'quill.bubble.css'
    }),
    'highlight.js/styles/github.css': `/highlight.js/styles/github.css`,
    ...getCdn('/', {
      'hiprint/css/hiprint.css': 'hiprint/css/hiprint.css',
      'hiprint/css/print-lock.css': 'hiprint/css/print-lock.css'
    }, { noUrlPrefix: true })
  },
  js: {
    vue: {
      moduleName: 'Vue',
      url: `/vue@2.6.10/dist/vue.min.js`
    },
    'vue-router': {
      moduleName: 'VueRouter',
      url: `/vue-router@3.0.2/dist/vue-router.min.js`
    },
    vuex: {
      moduleName: 'Vuex',
      url: `/vuex@3.1.0/dist/vuex.min.js`
    },
    'vue-lazyload': {
      moduleName: 'VueLazyload',
      url: `/vue-lazyload@1.3.3/vue-lazyload.js`
    },
    axios: {
      moduleName: 'axios',
      url: `/axios@0.19.0/dist/axios.min.js`
    },
    iview: {
      moduleName: 'iview',
      url: `/iview@3.5.4/dist/iview.min.js`
    },

    'video.js': {
      moduleName: 'videojs',
      url: `/video.js@7.6.6/dist/video.min.js`
    },
    quill: {
      moduleName: 'Quill',
      url: `/quill@1.3.7/dist/quill.min.js`
    },
    echarts: {
      moduleName: 'echarts',
      url: `/echarts@4.5.0/dist/echarts.min.js`
    },
    jquery: {
      moduleName: 'jQuery',
      url: `/jquery@3.5.1/dist/jquery.min.js`
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
