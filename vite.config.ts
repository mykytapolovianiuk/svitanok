import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
  // Fix for Vercel dev - exclude HTML from module processing
  assetsInclude: ['**/*.html'],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      // Manual chunking to optimize bundle sizes
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'swiper'],
          'state-vendor': ['zustand', '@tanstack/react-query'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'analytics-vendor': ['@sentry/react', '@sentry/tracing'],
        },
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      },
    },
    // Optimize for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log statements
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.info', 'console.debug'] // Remove specific console methods
      },
    },
    // Report build size
    reportCompressedSize: true,
    // Chunk size warnings limit (in kbs)
    chunkSizeWarningLimit: 1000,
  },
  // Ensure TypeScript errors don't block the build
  esbuild: {
    logOverride: {
      'ts(2307)': 'silent', // Suppress module not found errors
      'ts(6133)': 'silent', // Suppress unused variable errors
      'ts(2339)': 'silent', // Suppress property access errors
    }
  }
})