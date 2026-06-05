import { defineConfig } from 'orval';

export default defineConfig({
  educrm: {
    input: {
      target: process.env['NEXT_PUBLIC_API_URL']
        ? process.env['NEXT_PUBLIC_API_URL'] + '/api/v1/docs-json'
        : './src/openapi/schema.json',
      validation: false,
    },
    output: {
      mode: 'tags-split',
      target: './src/generated/api',
      schemas: './src/generated/models',
      client: 'react-query',
      httpClient: 'axios',
      mock: false,
      clean: true,
      override: {
        mutator: {
          path: './src/services/api/axios.instance.ts',
          name: 'axiosInstance',
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: true,
        },
        zod: {
          generate: {
            body: true,
            header: false,
            param: true,
            query: true,
            response: true,
          },
          coerce: {
            response: true,
            body: true,
          },
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write src/generated',
    },
  },
});