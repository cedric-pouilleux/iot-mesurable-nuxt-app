// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  alias: {
    '@module-card': path.resolve(__dirname, 'app/features/modules/common/card'),
    '@sensors-options': path.resolve(
      __dirname,
      'app/features/modules/common/sensors-module-options'
    ),
    '@benchmark-module-sensors': path.resolve(
      __dirname,
      'app/features/modules/benchmark-module-sensor'
    ),
    '#api': path.resolve(__dirname, 'app/api'),
  },

  modules: ['@nuxtjs/tailwindcss', '@nuxt/icon', '@nuxtjs/color-mode', '@nuxtjs/i18n'],

  i18n: {
    locales: [
      { code: 'fr', name: 'Français', file: 'fr.json' },
      { code: 'en', name: 'English', file: 'en.json' },
    ],
    defaultLocale: 'fr',
    strategy: 'prefix_except_default',
    langDir: 'locales',
    detectBrowserLanguage: {
      useCookie: false,
      fallbackLocale: 'fr',
      redirectOn: 'root',
    },
  },

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
  },

  icon: {
    serverBundle: 'local',
    clientBundle: {
      scan: true,
      includeCustomCollections: true,
    },
  },

  runtimeConfig: {
    public: {
      // En prod, on utilise SOCKET_URL=/ pour passer par Nginx (port 80)
      // En dev local, on utilise directement le backend sur le port 3001
      // Vous pouvez surcharger avec NUXT_PUBLIC_SOCKET_URL=http://localhost:3001
      socketUrl:
        process.env.NUXT_PUBLIC_SOCKET_URL ||
        (process.env.NODE_ENV !== 'production' ? 'http://localhost:3001' : '/'),
      // mqttPrefix removed
    },
  },

  typescript: {
    strict: false,
    typeCheck: false,
  },

  // SSR réactivé maintenant que le problème est résolu
  // ssr: false,

  // Proxy interne pour éviter les problèmes CORS et Docker Network
  routeRules: {
    // En dev local sans docker, fallback sur 127.0.0.1:3001 (IPv4 explicite)
    '/api/**': {
      proxy: `${process.env.API_URL || 'http://127.0.0.1:3001'}/api/**`.replace(
        '/api/api/',
        '/api/'
      ),
    },
  },
})
