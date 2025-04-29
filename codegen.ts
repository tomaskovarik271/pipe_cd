// codegen.ts (Example)
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  // Path to your GraphQL schema file(s)
  // Assumes you define your schema in the gateway function directory
  schema: "functions/graphql-gateway/schema.graphql",
  // Documents (operations) used in your frontend - Temporarily commented out
  // documents: "client/src/**/*.graphql",
  generates: {
    // Output for backend (resolver types)
    "lib/gql-types.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        // Path to your context type - Ensure this path is correct
        contextType: "./functions/graphql-gateway/context#MyContext", // Adjusted path relative to project root
        // mappers: { ... } // Optional: Map models to GraphQL types
      }
    },
    // Output for frontend (typed hooks/operations) - Temporarily disabled generation
    // "client/src/gql/": {
    //   preset: "client",
    //   plugins: [], // Preset includes required plugins
    //   presetConfig: {
    //     gqlTagName: 'gql', // If using gql tag
    //   }
    // }
  },
  hooks: {
    // afterAllFileWrite: ["prettier --write"] // Disable prettier hook if client generation is disabled
  }
};

export default config; 