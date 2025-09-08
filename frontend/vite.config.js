import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  const isDevelopment = mode === 'development'

  return {
    plugins: [
      react({
        // Enable Fast Refresh for better development experience
        fastRefresh: isDevelopment,
        // Optimize JSX in production
        jsxRuntime: 'automatic'
      }),
      // Bundle analyzer for production builds
      isProduction && visualizer({
        filename: 'dist/bundle-analysis.html',
        open: false,
        gzipSize: true,
        brotliSize: true
      })
    ].filter(Boolean),

    // Resolve configuration
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/components'),
        '@hooks': resolve(__dirname, 'src/hooks'),
        '@utils': resolve(__dirname, 'src/utils'),
        '@styles': resolve(__dirname, 'src/styles'),
        '@assets': resolve(__dirname, 'src/assets')
      }
    },

    // Development server configuration
    server: {
      port: 5173,
      host: true,
      open: false,
      // Enable CORS for API calls
      cors: true,
      // Proxy API calls to backend
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false
        },
        '/ws': {
          target: 'ws://localhost:8000',
          ws: true,
          changeOrigin: true
        }
      }
    },

    // Build configuration
    build: {
      // Output directory
      outDir: 'dist',
      // Generate source maps in development
      sourcemap: isDevelopment,
      // Minification
      minify: isProduction ? 'terser' : false,
      
      // Terser options for better compression
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug'],
          passes: 2
        },
        mangle: {
          safari10: true
        },
        format: {
          comments: false
        }
      } : undefined,

      // Rollup options for advanced bundling
      rollupOptions: {
        // External dependencies that shouldn't be bundled
        external: [],
        
        // Input files
        input: {
          main: resolve(__dirname, 'index.html')
        },
        
        // Output configuration
        output: {
          // Manual chunks for better caching
          manualChunks: {
            // Vendor chunk for third-party libraries
            vendor: [
              'react',
              'react-dom',
              'react-router-dom'
            ],
            // UI library chunk
            ui: [
              '@chakra-ui/react',
              '@emotion/react',
              '@emotion/styled',
              'framer-motion'
            ],
            // Utilities chunk
            utils: [
              'axios',
              'date-fns',
              'lodash-es'
            ],
            // React Window for virtualization
            virtualization: [
              'react-window',
              'react-window-infinite-loader'
            ]
          },
          
          // Chunk file naming
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId
            if (facadeModuleId) {
              const fileName = facadeModuleId.split('/').pop()?.replace('.jsx', '').replace('.js', '')
              return `assets/chunks/${fileName}-[hash].js`
            }
            return 'assets/chunks/[name]-[hash].js'
          },
          
          // Entry file naming
          entryFileNames: 'assets/[name]-[hash].js',
          
          // Asset file naming
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.')
            const ext = info[info.length - 1]
            
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash].${ext}`
            }
            if (/woff2?|eot|ttf|otf/i.test(ext)) {
              return `assets/fonts/[name]-[hash].${ext}`
            }
            return `assets/[name]-[hash].${ext}`
          }
        }
      },

      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
      
      // CSS code splitting
      cssCodeSplit: true,
      
      // Asset inlining threshold
      assetsInlineLimit: 4096,
      
      // Report compressed size
      reportCompressedSize: isProduction,
      
      // Empy outDir before build
      emptyOutDir: true
    },

    // CSS configuration
    css: {
      modules: {
        localsConvention: 'camelCase'
      },
      // CSS optimization for production
      postcss: isProduction ? {
        plugins: [
          require('autoprefixer'),
          require('cssnano')({
            preset: 'default'
          })
        ]
      } : undefined
    },

    // Optimization configuration
    optimizeDeps: {
      // Include dependencies that should be pre-bundled
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@chakra-ui/react',
        'framer-motion',
        'react-window'
      ],
      // Exclude dependencies from pre-bundling
      exclude: [
        // Large dependencies that change frequently
      ],
      // ESbuild options
      esbuildOptions: {
        target: 'es2020',
        // Tree shaking
        treeShaking: true
      }
    },

    // Environment variables
    define: {
      __DEV__: isDevelopment,
      __PROD__: isProduction
    },

    // Testing configuration
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      // Test coverage
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.test.{js,jsx}',
          '**/*.spec.{js,jsx}'
        ]
      }
    },

    // Performance hints
    esbuild: {
      target: 'es2020',
      // Remove console.log in production
      drop: isProduction ? ['console', 'debugger'] : [],
      // Tree shaking
      treeShaking: true
    },

    // Preview server configuration
    preview: {
      port: 4173,
      host: true,
      open: false
    }
  }
})