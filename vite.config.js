import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// Импортируем необходимые модули Node.js
import fs from 'node:fs'
import path from 'node:path'

// https://vite.dev/config/
// Адреса dev-сервера и прокси берутся из .env.development.local (не в git,
// свои на каждой машине) — переопределить: DEV_HOST, DEV_PORT,
// PROXY_APITIME_TARGET, PROXY_API_TARGET, PROXY_APIREF_TARGET.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue(),
      vueDevTools(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico'],
        // Включает манифест и service worker в `npm run dev`, а не только в сборке.
        devOptions: { enabled: true },
        manifest: {
          name: 'Учет времени',
          short_name: 'Учет времени',
          description: 'Учёт рабочего времени, отпусков и чеков',
          start_url: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#0060e5',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // API-запросы: сперва сеть, кеш — только как запасной вариант при офлайне.
          runtimeCaching: [
            {
              urlPattern: /^\/api(time|ref)?\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 10,
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
    server: {
      host: env.DEV_HOST || '0.0.0.0',
      port: Number(env.DEV_PORT) || 5178,
      https: {
        // Используем правильные пути
        key: fs.readFileSync(path.resolve(process.cwd(), 'key.pem')),
        cert: fs.readFileSync(path.resolve(process.cwd(), 'cert.pem')),
      },
      cors: true,
      proxy: {
        '/apitime': {
          target: env.PROXY_APITIME_TARGET || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path.replace(/^\/apitime/, '/v1'),
          configure: (proxy, options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err)
            })
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url)
            })
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log(
                'Received Response from the Target:',
                proxyRes.statusCode,
                req.url
              )
            })
          },
        },
        '/api': {
          target: env.PROXY_API_TARGET || 'http://localhost:8382',
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
          configure: (proxy, options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err)
            })
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url)
            })
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log(
                'Received Response from the Target:',
                proxyRes.statusCode,
                req.url
              )
            })
          },
        },
        '/apiref': {
          target: env.PROXY_APIREF_TARGET || 'http://192.168.88.2:8388',
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
          configure: (proxy, options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err)
            })
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url)
            })
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log(
                'Received Response from the Target:',
                proxyRes.statusCode,
                req.url
              )
            })
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
