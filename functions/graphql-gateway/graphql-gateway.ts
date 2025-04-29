// functions/graphql-gateway/graphql-gateway.ts
import { ApolloServer } from '@apollo/server';
import type { Handler, HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions';
import { readFileSync } from 'fs';
import path from 'path';
import { resolvers } from './resolvers';
import { createContext, MyContext } from './context';

// Helper function to parse body
function parseRequestBody(body: string | null, isBase64Encoded: boolean): any {
    if (!body) {
        return null;
    }
    try {
        const decodedBody = isBase64Encoded ? Buffer.from(body, 'base64').toString('utf8') : body;
        return JSON.parse(decodedBody);
    } catch (e) {
        console.error('Error parsing request body:', e);
        return null;
    }
}

// Load schema only once, outside the handler
let typeDefs: string;
try {
    // Prefer reading relative to process CWD which is more stable in Netlify build/dev
    const schemaPath = path.resolve(process.cwd(), 'functions', 'graphql-gateway', 'schema.graphql');
    typeDefs = readFileSync(schemaPath, 'utf8');
    console.log(`Successfully loaded schema from: ${schemaPath}`);
} catch (err) {
    console.error(`Error reading schema:`, err);
    throw new Error('Could not load GraphQL schema file.');
}

// Initialize Apollo Server instance once, outside the handler
const server = new ApolloServer<MyContext>({
    typeDefs,
    resolvers,
    // Disable introspection in production unless explicitly enabled
    introspection: process.env.ENABLE_GQL_INTROSPECTION === 'true' || process.env.NODE_ENV !== 'production',
});

// Main Netlify Function handler
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext): Promise<HandlerResponse> => {
    try {
        // Handle GET requests (e.g., for Playground or health check)
        if (event.httpMethod === 'GET') {
            // Simple health check / playground placeholder for GET
            return {
                statusCode: 200,
                body: 'GraphQL Gateway is running. Send POST for queries.',
                headers: { 'Content-Type': 'text/plain' }
            };
        }

        // Handle only POST requests for operations
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                body: `Method ${event.httpMethod} Not Allowed`,
                headers: { 'Allow': 'POST, GET', 'Content-Type': 'text/plain' }
            };
        }

        // Parse the GraphQL operation from the request body
        const operation = parseRequestBody(event.body, event.isBase64Encoded);
        if (!operation || !operation.query) {
            return { statusCode: 400, body: 'Invalid or missing GraphQL operation in request body.', headers: {'Content-Type': 'text/plain'} };
        }

        // Create context for this specific request
        const requestContext = await createContext({ event, context });

        // Execute the GraphQL operation
        const response = await server.executeOperation(
            {
                query: operation.query,
                variables: operation.variables,
                operationName: operation.operationName,
            },
            {
                contextValue: requestContext,
            }
        );

        // Format the response for Netlify Function
        if (response.body.kind === 'single') {
             return {
                statusCode: 200,
                body: JSON.stringify(response.body.singleResult),
                headers: { 'Content-Type': 'application/json' }
            };
        } else {
            console.error('Unexpected incremental response kind:', response.body.kind);
            return { statusCode: 500, body: 'Unhandled response type from Apollo Server', headers: {'Content-Type': 'text/plain'} };
        }

    } catch (error: unknown) {
        console.error('GraphQL handler error:', error);
        // Ensure error is an instance of Error before accessing message
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return {
            statusCode: 500,
            body: JSON.stringify({ message }),
            headers: { 'Content-Type': 'application/json' }
        };
    }
}; 