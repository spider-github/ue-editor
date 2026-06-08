import vue from '@vitejs/plugin-vue2'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'vue2-ueditor-plus-editor': path.resolve(__dirname, '../../packages/vue2-ueditor-plus/src/index.js'),
    },
  },
  publicDir: 'public',
})
