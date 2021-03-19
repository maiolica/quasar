import { createApp } from 'vue'

import Platform from './plugins/Platform.js'
import Screen from './plugins/Screen.js'
import Dark from './plugins/Dark.js'
import History from './history.js'
import Lang from './lang.js'
import Body from './body.js'
import IconSet from './icon-set.js'

import { quasarKey } from './utils/private/symbols.js'

const autoInstalled = [
  Platform, Screen, Dark
]

export function createChildApp (appCfg, appInstance) {
  const app = createApp(appCfg)

  app.config.globalProperties = appInstance.config.globalProperties

  const { reload, ...appContext } = appInstance._context
  Object.assign(app._context, appContext)

  return app
}

function installPlugins (pluginOpts, pluginList) {
  pluginList.forEach(Plugin => {
    Plugin.install(pluginOpts)
    Plugin.__installed = true
  })
}

function prepareApp (app, uiOpts, pluginOpts) {
  app.config.globalProperties.$q = pluginOpts.$q
  app.provide(quasarKey, pluginOpts.$q)

  installPlugins(pluginOpts, [
    Platform,
    Body,
    Dark,
    Screen,
    History,
    Lang,
    IconSet
  ])

  uiOpts.components !== void 0 && Object.values(uiOpts.components).forEach(c => {
    if (Object(c) === c && c.name !== void 0) {
      app.component(c.name, c)
    }
  })

  uiOpts.directives !== void 0 && Object.values(uiOpts.directives).forEach(d => {
    if (Object(d) === d && d.name !== void 0) {
      app.directive(d.name, d)
    }
  })

  uiOpts.plugins !== void 0 && installPlugins(
    pluginOpts,
    Object.values(uiOpts.plugins).filter(
      p => typeof p.install === 'function' && autoInstalled.includes(p) === false
    )
  )
}

export default __QUASAR_SSR_SERVER__
  ? function (app, opts = {}, ssrContext) {
      const $q = {
        version: __QUASAR_VERSION__,
        config: Object.freeze(opts.config || {})
      }

      ssrContext.$q = $q

      Object.assign(ssrContext._meta, {
        htmlAttrs: '',
        headTags: '',
        bodyClasses: '',
        bodyAttrs: 'data-server-rendered',
        bodyTags: ''
      })

      app.config.globalProperties.ssrContext = ssrContext

      prepareApp(app, opts, {
        app,
        $q,
        cfg: $q.config,
        lang: opts.lang,
        iconSet: opts.iconSet,
        ssrContext
      })
    }
  : function (app, opts = {}) {
    const $q = {
      version: __QUASAR_VERSION__,
      config: Object.freeze(opts.config || {})
    }

    prepareApp(app, opts, {
      app,
      $q,
      cfg: $q.config,
      lang: opts.lang,
      iconSet: opts.iconSet,
      onSSRHydrated: []
    })
  }
