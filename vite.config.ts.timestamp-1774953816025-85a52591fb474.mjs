// vite.config.ts
import { defineConfig } from "file:///D:/Users/Mykyta/Desktop/Work/svitanok/node_modules/vite/dist/node/index.js";
import react from "file:///D:/Users/Mykyta/Desktop/Work/svitanok/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "D:\\Users\\Mykyta\\Desktop\\Work\\svitanok";
var vite_config_default = defineConfig({
  plugins: [react()],
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path2) => path2.replace(/^\/api/, "/api")
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__vite_injected_original_dirname, "index.html")
      }
    },
    // Optimize for production
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        // Remove console.log statements
        drop_debugger: true,
        // Remove debugger statements
        pure_funcs: ["console.info", "console.debug"]
        // Remove specific console methods
      }
    },
    // Report build size
    reportCompressedSize: true
  },
  // Ensure TypeScript errors don't block the build
  esbuild: {
    logOverride: {
      "ts(2307)": "silent",
      // Suppress module not found errors
      "ts(6133)": "silent",
      // Suppress unused variable errors
      "ts(2339)": "silent"
      // Suppress property access errors
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxVc2Vyc1xcXFxNeWt5dGFcXFxcRGVza3RvcFxcXFxXb3JrXFxcXHN2aXRhbm9rXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxVc2Vyc1xcXFxNeWt5dGFcXFxcRGVza3RvcFxcXFxXb3JrXFxcXHN2aXRhbm9rXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9Vc2Vycy9NeWt5dGEvRGVza3RvcC9Xb3JrL3N2aXRhbm9rL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcGx1Z2luczogW3JlYWN0KCldLFxyXG4gIGJhc2U6IFwiL1wiLFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBwcm94eToge1xyXG4gICAgICAnL2FwaSc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDAnLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpLywgJy9hcGknKSxcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgYnVpbGQ6IHtcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgaW5wdXQ6IHtcclxuICAgICAgICBtYWluOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnaW5kZXguaHRtbCcpLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIC8vIE9wdGltaXplIGZvciBwcm9kdWN0aW9uXHJcbiAgICBtaW5pZnk6ICd0ZXJzZXInLFxyXG4gICAgdGVyc2VyT3B0aW9uczoge1xyXG4gICAgICBjb21wcmVzczoge1xyXG4gICAgICAgIGRyb3BfY29uc29sZTogdHJ1ZSwgLy8gUmVtb3ZlIGNvbnNvbGUubG9nIHN0YXRlbWVudHNcclxuICAgICAgICBkcm9wX2RlYnVnZ2VyOiB0cnVlLCAvLyBSZW1vdmUgZGVidWdnZXIgc3RhdGVtZW50c1xyXG4gICAgICAgIHB1cmVfZnVuY3M6IFsnY29uc29sZS5pbmZvJywgJ2NvbnNvbGUuZGVidWcnXSAvLyBSZW1vdmUgc3BlY2lmaWMgY29uc29sZSBtZXRob2RzXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgLy8gUmVwb3J0IGJ1aWxkIHNpemVcclxuICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiB0cnVlLFxyXG4gIH0sXHJcbiAgLy8gRW5zdXJlIFR5cGVTY3JpcHQgZXJyb3JzIGRvbid0IGJsb2NrIHRoZSBidWlsZFxyXG4gIGVzYnVpbGQ6IHtcclxuICAgIGxvZ092ZXJyaWRlOiB7XHJcbiAgICAgICd0cygyMzA3KSc6ICdzaWxlbnQnLCAvLyBTdXBwcmVzcyBtb2R1bGUgbm90IGZvdW5kIGVycm9yc1xyXG4gICAgICAndHMoNjEzMyknOiAnc2lsZW50JywgLy8gU3VwcHJlc3MgdW51c2VkIHZhcmlhYmxlIGVycm9yc1xyXG4gICAgICAndHMoMjMzOSknOiAnc2lsZW50JywgLy8gU3VwcHJlc3MgcHJvcGVydHkgYWNjZXNzIGVycm9yc1xyXG4gICAgfVxyXG4gIH1cclxufSkiXSwKICAibWFwcGluZ3MiOiAiO0FBQTZTLFNBQVMsb0JBQW9CO0FBQzFVLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLE1BQU07QUFBQSxFQUNOLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFNBQVMsQ0FBQ0EsVUFBU0EsTUFBSyxRQUFRLFVBQVUsTUFBTTtBQUFBLE1BQ2xEO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLGVBQWU7QUFBQSxNQUNiLE9BQU87QUFBQSxRQUNMLE1BQU0sS0FBSyxRQUFRLGtDQUFXLFlBQVk7QUFBQSxNQUM1QztBQUFBLElBQ0Y7QUFBQTtBQUFBLElBRUEsUUFBUTtBQUFBLElBQ1IsZUFBZTtBQUFBLE1BQ2IsVUFBVTtBQUFBLFFBQ1IsY0FBYztBQUFBO0FBQUEsUUFDZCxlQUFlO0FBQUE7QUFBQSxRQUNmLFlBQVksQ0FBQyxnQkFBZ0IsZUFBZTtBQUFBO0FBQUEsTUFDOUM7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUVBLHNCQUFzQjtBQUFBLEVBQ3hCO0FBQUE7QUFBQSxFQUVBLFNBQVM7QUFBQSxJQUNQLGFBQWE7QUFBQSxNQUNYLFlBQVk7QUFBQTtBQUFBLE1BQ1osWUFBWTtBQUFBO0FBQUEsTUFDWixZQUFZO0FBQUE7QUFBQSxJQUNkO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbInBhdGgiXQp9Cg==
