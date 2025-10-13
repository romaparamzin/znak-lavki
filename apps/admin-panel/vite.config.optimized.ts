/**
 * Optimized Vite Configuration
 * Focused on bundle size reduction and performance
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression2';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh
      fastRefresh: true,
      
      // Babel plugins for optimization
      babel: {
        plugins: [
          // Remove console logs in production
          ['transform-remove-console', { exclude: ['error', 'warn'] }],
        ],
      },
    }),

    // Gzip compression
    compression({
      algorithm: 'gzip',
      exclude: [/\.(br)$/, /\.(gz)$/],
      threshold: 1024, // Only compress files > 1KB
    }),

    // Brotli compression (better than gzip)
    compression({
      algorithm: 'brotliCompress',
      exclude: [/\.(br)$/, /\.(gz)$/],
      threshold: 1024,
    }),

    // Bundle size visualization
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // or 'sunburst', 'network'
    }),
  ],

  // ============================================
  // BUILD OPTIMIZATIONS
  // ============================================
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2020',
    
    // Enable minification
    minify: 'terser',
    
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2, // Multiple passes for better compression
      },
      mangle: {
        safari10: true, // Safari 10 compatibility
      },
      format: {
        comments: false, // Remove all comments
      },
    },

    // Rollup optimization options
    rollupOptions: {
      output: {
        // Manual code splitting
        manualChunks: {
          // Vendor chunk (React, ReactDOM, etc.)
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          
          // UI library chunk (Ant Design)
          'vendor-antd': ['antd', '@ant-design/icons'],
          
          // Charts chunk (Recharts)
          'vendor-charts': ['recharts'],
          
          // API client chunk
          'vendor-api': ['axios', '@tanstack/react-query'],
          
          // Utilities
          'vendor-utils': ['dayjs', 'zustand'],
        },
        
        // Naming convention for chunks
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
      
      // External dependencies (if using CDN)
      external: [],
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 500, // Warn if chunk > 500KB
    
    // Source maps (disable in production for smaller size)
    sourcemap: false,
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Optimize CSS
    cssMinify: true,
    
    // Asset inline limit (smaller assets will be base64 inlined)
    assetsInlineLimit: 4096, // 4KB
    
    // Report compressed size
    reportCompressedSize: true,
  },

  // ============================================
  // OPTIMIZATION
  // ============================================
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'antd',
      '@ant-design/icons',
      'recharts',
      'axios',
      '@tanstack/react-query',
    ],
    
    // Force optimization even if already in node_modules
    force: false,
  },

  // ============================================
  // SERVER CONFIG
  // ============================================
  server: {
    port: 5173,
    strictPort: true,
    
    // HTTP/2 for better performance
    // https: true, // Enable in production
    
    // Proxy API calls
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  // ============================================
  // RESOLVE
  // ============================================
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },

  // ============================================
  // PREVIEW (for testing production build)
  // ============================================
  preview: {
    port: 4173,
    strictPort: true,
  },
});

/**
 * Bundle Size Optimization Checklist:
 * 
 * 1. ✅ Code splitting (manual chunks)
 * 2. ✅ Tree shaking (ES modules)
 * 3. ✅ Minification (Terser)
 * 4. ✅ Compression (Gzip + Brotli)
 * 5. ✅ Remove console logs
 * 6. ✅ CSS code splitting
 * 7. ✅ Asset optimization
 * 8. ✅ Modern browser target (ES2020)
 * 9. ⚠️  Consider lazy loading for routes
 * 10. ⚠️ Consider CDN for large libraries
 * 
 * Commands:
 * - Build: npm run build
 * - Analyze: npm run build && open dist/stats.html
 * - Preview: npm run preview
 */

