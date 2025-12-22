import { defineConfig } from 'orval'

export default defineConfig({
  api: {
    input: 'http://localhost:3001/documentation/json',
    output: {
      mode: 'split',
      target: 'app/api/client.ts',
      schemas: 'app/api/model',
      client: 'fetch',
      baseUrl: 'http://localhost:3001',
    },
  },
})

