import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' → 상대경로 빌드라 GitHub Pages 서브경로에서도 그대로 동작
export default defineConfig({
  plugins: [react()],
  base: './',
})
