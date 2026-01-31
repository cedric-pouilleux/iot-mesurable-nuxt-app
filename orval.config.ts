import { defineConfig } from 'orval'

export default defineConfig({
  api: {
    input: './openapi.json',
    output: {
      mode: 'split',
      target: 'app/api/client.ts',
      schemas: 'app/api/model',
      client: 'fetch',
      baseUrl: '',
    },
  },
})

