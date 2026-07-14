import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    // Mirror tsconfig "@/*" → "./*"
    alias: { '@': path.resolve(__dirname, '.') },
  },
  test: {
    environment: 'node',
  },
})
