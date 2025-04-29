// functions/graphql-gateway/graphql-gateway.ts
// Note: Uses apollo-server-lambda
import { ApolloServer as ApolloServerLambda } from 'apollo-server-lambda'; // Use the lambda-specific server
import type { HandlerEvent, HandlerContext } from '@netlify/functions';
import { readFileSync } from 'fs';
import path from 'path';
import { resolvers } from './resolvers';
import { createContext } from './context'; // Import our custom context function

// Determine the correct base directory for reading the schema
const schemaPath = path.resolve(__dirname, 'schema.graphql');
let typeDefs: string;
try {
    typeDefs = readFileSync(schemaPath, 'utf8');
} catch (err) {
    console.error(`Error reading schema at ${schemaPath}:`, err);
    const fallbackSchemaPath = path.resolve(process.cwd(), 'functions', 'graphql-gateway', 'schema.graphql');
    try {
        console.log(`Attempting fallback schema path: ${fallbackSchemaPath}`);
        typeDefs = readFileSync(fallbackSchemaPath, 'utf8');
    } catch (fallbackErr) {
        console.error(`Error reading schema at fallback ${fallbackSchemaPath}:`, fallbackErr);
        throw new Error('Could not load GraphQL schema file.');
    }
}


const server = new ApolloServerLambda({
  typeDefs,
  resolvers,
  // Pass the context function directly.
  // apollo-server-lambda automatically passes the event and context from the Lambda environment.
  context: ({ event, context }: { event: HandlerEvent, context: HandlerContext }) => {
      // Our existing createContext function matches this signature
      return createContext({ event, context });
  },
  // Introspection and playground are often enabled by default in dev with apollo-server-lambda v3
  // but can be explicitly controlled for production.
  introspection: process.env.NODE_ENV !== 'production',
  // Note: apollo-server-lambda v3 might enable playground by default in non-production
  // playground: process.env.NODE_ENV !== 'production', // Deprecated/Removed in AS4, handled differently
});

// Export the handler created by apollo-server-lambda
// This is simpler than the @as-integrations approach
export const handler = server.createHandler(); 