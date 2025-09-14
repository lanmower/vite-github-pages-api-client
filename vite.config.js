import { defineConfig } from 'vite'

export default defineConfig({
  // Base path for GitHub Pages deployment
  base: '/vite-github-pages-api-client/',

  // Build configuration optimized for GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['axios']
        }
      }
    }
  },

  // Development server configuration
  server: {
    port: 3000,
    open: true,

    // Proxy configuration for development environment only
    // NOTE: This will NOT work on GitHub Pages (static hosting)
    // CORS must be handled by the Google Apps Script endpoint
    proxy: {
      '/api': {
        target: 'https://script.google.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/macros/s/YOUR_SCRIPT_ID/exec'),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  },

  // Preview server configuration
  preview: {
    port: 4173,
    open: true
  },

  // Define global constants for different environments
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __PROD__: JSON.stringify(process.env.NODE_ENV === 'production'),
    __GITHUB_PAGES__: JSON.stringify(process.env.GITHUB_PAGES === 'true')
  }
})