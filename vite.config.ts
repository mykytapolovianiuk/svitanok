import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'


export default defineConfig({
  plugins: [react()],
  base: "/",
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
    
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, 
        drop_debugger: true, 
        pure_funcs: ['console.info', 'console.debug'] 
      },
    },
    
    reportCompressedSize: true,
  },
  
  esbuild: {
    logOverride: {
      'ts(2307)': 'silent', 
      'ts(6133)': 'silent', 
      'ts(2339)': 'silent', 
    }
  }
})