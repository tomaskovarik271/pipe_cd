// codegen.ts (Example)
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  // Path to your GraphQL schema file(s)
  // Assumes you define your schema in the gateway function directory
  schema: "functions/graphql-gateway/schema.graphql",
  // Documents (operations) used in your frontend
  documents: "client/src/**/*.graphql",
  generates: {
    // Output for backend (resolver types)
    "lib/gql-types.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        // Path to your context type - ADJUST IF NEEDED
        contextType: "../functions/graphql-gateway/context#MyContext",
        // mappers: { ... } // Optional: Map models to GraphQL types
      }
    },
    // Output for frontend (typed hooks/operations)
    "client/src/gql/": {
      preset: "client",
      plugins: [], // Preset includes required plugins
      presetConfig: {
        gqlTagName: 'gql', // If using gql tag
      }
    }
  },
  hooks: {
    afterAllFileWrite: ["prettier --write"]
  }
};

export default config; 