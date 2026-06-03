import { defineConfig } from 'orval';

export default defineConfig({
  educrm: {
    input: {
  target: './src/openapi/schema.json',
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
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
});
