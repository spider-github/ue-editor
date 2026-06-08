import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'Vue2UeditorPlus',
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ['vue', 'axios'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
          axios: 'axios',
        },
      },
    },
  },
})
