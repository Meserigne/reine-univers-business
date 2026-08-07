import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
    server: {
      host: '127.0.0.1',
    },
  },
  nitro: {
    preset: process.env.NITRO_PRESET || undefined,
    devProxy: {},
  },
  devServer: {
    host: '127.0.0.1',
    port: 3000,
  },
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3001',
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    },
  },
  app: {
    head: {
      title: 'Reine Univers Business — Viande fraîche',
      htmlAttrs: { lang: 'fr' },
      meta: [
        {
          name: 'description',
          content:
            'Reine Univers Business — viande fraîche : poulet, œufs, mouton, veau et porc, toujours frais du jour.',
        },
      ],
      link: [{ rel: 'icon', type: 'image/png', href: '/logo.png' }],
    },
  },
})
