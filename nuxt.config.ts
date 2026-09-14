export default defineNuxtConfig({
  compatibilityDate: '2026-09-14',
  ssr: false,
  nitro: { preset: 'github_pages' },
  app: {
    head: {
      title: 'OR//CREDITS',
      htmlAttrs: { lang: 'en' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap' },
      ],
    },
  },
})
