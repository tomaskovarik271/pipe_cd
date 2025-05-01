# Developer Run-book: Custom CRM System

This run-book provides practical instructions for setting up the development environment, configuring services, and following implementation patterns for the Custom CRM project. **Refer to `ADR.md` for architectural decisions and `PROJECT_ROADMAP.md` for phased implementation.**

## 1. Prerequisites & Initial Environment Verification

*   **Development Environment:**
    *   **Node.js & npm:** Latest LTS version (e.g., v18.x.x or v20.x.x). **Verify:** `node -v`.
    *   **Git:** Standard installation. **Verify:** `git --version`.
    *   **VS Code / Cursor:** Recommended IDE.
    *   **Netlify CLI:** Install globally: `npm install -g netlify-cli`. **Verify:** `netlify --version`.
    *   **Supabase CLI:** Install via package manager (e.g., `brew install supabase/tap/supabase` for macOS). **Verify:** `supabase --version`.
    *   **Docker:** Required for Supabase local development. Ensure Docker Desktop (or equivalent) is installed and running.

*   **Accounts Required:**
    *   [Netlify](https://app.netlify.com/)
    *   [Supabase](https://app.supabase.io/)
    *   [Inngest](https://www.inngest.com/) (See ADR-003)
    *   Git provider account (GitHub, GitLab, etc.)

*   **Initial Verification Steps:**
    *   Confirm all CLIs are installed and accessible from your terminal.
    *   Ensure Docker daemon is running.
    *   **Troubleshooting NPX:** If `npx` commands (like package initializers) behave unexpectedly, try clearing the cache: `npx clear-npx-cache`.

## 2. Initial Project Setup

These steps set up the basic project structure and configuration files. (Assumes you are in the root project directory).

1.  **Init Git/NPM (if not already done):**
    ```bash
    # git init # If needed
    # npm init -y # If needed
    ```

2.  **Create `.gitignore`:**
    ```bash
    # Ensure this includes standard Node, IDE, OS, and service-specific files
    echo "node_modules/
    .env*
    !.env.example
    .netlify/
    dist/
    build/
    coverage/
    *.log
    supabase/.temp/
    client/dist/
    client/node_modules/
    .vscode/
    *.DS_Store
    " > .gitignore
    ```

3.  **Create `.env.example`:** (Documents required local variables)
    ```bash
    # Supabase Local Credentials (Get from 'npm run supabase:status')
    SUPABASE_URL=http://localhost:54321
    SUPABASE_ANON_KEY=YOUR_LOCAL_ANON_KEY
    SUPABASE_SERVICE_ROLE_KEY=YOUR_LOCAL_SERVICE_KEY

    # Frontend Supabase Credentials (Ensure these match local keys above)
    # Vite uses VITE_ prefix by default
    VITE_SUPABASE_URL=http://localhost:54321
    VITE_SUPABASE_ANON_KEY=YOUR_LOCAL_ANON_KEY

    # Inngest Credentials (Get from Inngest dashboard - If using)
    INNGEST_EVENT_KEY=YOUR_INNGEST_EVENT_KEY
    INNGEST_SIGNING_KEY=YOUR_INNGEST_SIGNING_KEY
    ```
    *Note: Create `.env` locally (and ensure it's gitignored) for actual secrets. Use `npm run setup:env`.*)

4.  **Create Directory Structure:**
    ```bash
    mkdir -p functions/graphql-gateway functions/inngest # Add other domain functions later
    mkdir -p lib/customer-data lib/deals lib/activities # For shared backend logic/types
    mkdir -p supabase/migrations
    # Add .keep files to empty directories to ensure they are committed
    touch functions/graphql-gateway/.keep functions/inngest/.keep
    touch lib/customer-data/.keep lib/deals/.keep lib/activities/.keep
    ```

5.  **Install Core Backend & Gateway Dependencies (Root `package.json`):**
    ```bash
    # Runtime dependencies (Stable versions)
    npm install @apollo/server@^4 @as-integrations/aws-lambda graphql@^16 graphql-tag@^2 # Gateway
    npm install @supabase/supabase-js@^2 @supabase/ssr # Supabase
    npm install inngest@^3 zod@^3 # Inngest & Validation

    # Development dependencies
    npm install -D netlify-cli@^17 jest@^29 eslint@^8 typescript@^5 @types/node@^18 @types/jest@^29 ts-jest@^29
    npm install -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-resolvers # GraphQL Codegen
    # Add linters/formatters (e.g., eslint-config-prettier, prettier)
    ```
    *(Frontend dependencies installed separately in `client/` directory - See Section 5.3)*

6.  **Configure `netlify.toml`:**
    ```toml
    [build]
      # Command to install root deps, client deps, then build the client
      command = "npm install && npm install --prefix client && npm run build --prefix client"
      # Output directory for the built frontend client (Vite default)
      publish = "client/dist"
      # Directory containing Netlify functions
      functions = "functions/"

    [dev]
      # Command to run the frontend development server (Vite)
      command = "npm run dev --prefix client"
      # Port the frontend dev server runs on (Default Vite port)
      targetPort = 5173
      # Port Netlify Dev serves the whole site on
      port = 8888
      # Framework detection hint (helps Netlify Dev proxying)
      framework = "vite" # Ensure no '#' prefix
      # Pass Supabase URL/Key to the frontend dev server
      env = { VITE_SUPABASE_URL = "$SUPABASE_URL", VITE_SUPABASE_ANON_KEY = "$SUPABASE_ANON_KEY" }
      # Automatically launches the browser
      autoLaunch = true

    # Proxy requests to /graphql to the gateway function
    [[redirects]]
      from = "/graphql"
      to = "/.netlify/functions/graphql-gateway"
      status = 200 # Use 200 for function proxies

    # Proxy requests to /api/inngest to the inngest handler function
    [[redirects]]
      from = "/api/inngest"
      to = "/.netlify/functions/inngest"
      status = 200

    # SPA fallback: Route all other requests to index.html for client-side routing
    [[redirects]]
      from = "/*"
      to = "/index.html"
      status = 200

    # Global function settings
    [functions]
      # Use esbuild for faster bundling
      node_bundler = "esbuild"
      # Optional: Increase default timeout for specific functions if needed
      # "graphql-gateway" = { timeout = 15 }

    # Set Node.js version for all functions (Use LTS)
    [functions."*"]
      node_version = "18"
    ```

7.  **Create Initial `package.json` Scripts (Root):**
    ```json
    "scripts": {
      "dev": "netlify dev",
      "build:client": "npm run build --prefix client",
      "supabase:start": "supabase start",
      "supabase:stop": "supabase stop",
      "supabase:stop:all": "supabase stop --no-backup",
      "supabase:reset": "supabase db reset",
      "supabase:status": "supabase status",
      "supabase:migration:new": "supabase migration new",
      "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
      "test": "jest --passWithNoTests --detectOpenHandles --testPathIgnorePatterns=client/",
      "test:watch": "jest --watch --passWithNoTests --detectOpenHandles --testPathIgnorePatterns=client/",
      "setup:env": "cp .env.example .env && echo \"✅ Created .env file. Please populate keys using 'npm run supabase:status' and Inngest dashboard.\"",
      "gql:codegen": "graphql-codegen --config codegen.ts",
      "typecheck": "tsc --noEmit"
    }
    ```
    *Note: Add specific lint/test scripts for client/*

8.  **Setup TypeScript (`tsconfig.json` - Root):**
    ```json
    // tsconfig.json (Example for backend/shared code)
    {
      "compilerOptions": {
        "target": "ES2020",
        "module": "CommonJS", // Or ESNext if using ESM
        "lib": ["ES2020"],
        "outDir": "./dist", // Or adjust as needed, may not be strictly necessary for functions
        "rootDir": ".", // Include root for scripts, adjust if needed
        "baseUrl": ".",
        "paths": { // Optional: For path aliases if using
          "@lib/*": ["lib/*"]
        },
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "moduleResolution": "node",
        "resolveJsonModule": true,
        "isolatedModules": true // Often needed for bundlers
        // Add other options as needed (e.g., sourceMap)
      },
      "include": ["lib/**/*.ts", "functions/**/*.ts", "scripts/**/*.ts"], // Adjust paths
      "exclude": ["node_modules", "client", "dist", "supabase"]
    }
    ```

9.  **Setup GraphQL Codegen (`codegen.ts` - Root):**
    ```typescript
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
            contextType: "../functions/graphql-gateway/context#MyContext", // Path to your context type
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
    ```
    *Create `functions/graphql-gateway/schema.graphql` with initial types.*
    *Run `npm run gql:codegen` after setup.*

## 3. Cloud Service Setup & Verification

Follow these steps carefully to connect local development to cloud services and set up production environments. *(Details largely unchanged from previous version, ensure accuracy)*

### 3.1. Supabase Configuration & Verification

1.  **Create Supabase Project (Production):** Via Supabase Dashboard. **Save the DB password securely.** Choose region carefully based on residency needs.
2.  **Initialize Supabase Locally:** Run `supabase login` then `supabase init` in the project root.
3.  **Start Local Supabase Instance:** Run `npm run supabase:start`. Verify Docker containers start correctly. **Troubleshooting:**
    *   Use `npm run supabase:stop` or `npm run supabase:stop:all` if Docker containers don't shut down properly.
    *   **Port Conflicts:** If `supabase start` fails due to "port is already allocated", edit `supabase/config.toml` and change the conflicting port(s) (e.g., `[db].port`, `[studio].port`, `[api].port`, `[analytics].port`) to unused values (e.g., add 10 or 100 to the default). See `config.toml` for details.
    *   **`.env` Parsing Errors:** If `supabase start` or `reset` fails with `failed to load .env` or `unexpected character`, ensure your `.env` file is correctly formatted: keys should be on a single line with no internal line breaks, especially the long Supabase/Inngest keys.
4.  **Get Local API Credentials:** Run `npm run supabase:status`. Note the local `API URL`, `anon key`, `service_role key`. *Note: The URLs/ports shown will reflect any changes made in `config.toml`.*
5.  **Configure Local Environment (`.env`):** Run `npm run setup:env` then **populate `.env`** with the local keys from `supabase status` and your Inngest keys. **Ensure keys are pasted without internal line breaks.** Match `SUPABASE_*` and `VITE_SUPABASE_*` vars.
6.  **Configure Auth Providers (Production):** In Supabase Dashboard → Authentication → Providers. **Toggle ON** required providers (e.g., Email). Add required redirect URLs.
7.  **Configure URLs (Production):** In Supabase Dashboard → Authentication → URL Configuration. Set **Site URL** (production Netlify URL) and **Redirect URLs** (add `http://localhost:8888` for Netlify Dev, plus production URL).
8.  **Configure Email Templates (Production):** Customize as needed.
9.  **Link Local Project (Optional but Recommended):** `supabase link --project-ref <prod-project-ref>` (requires DB password). Helps with pulling remote schema changes.
10. **Prepare Initial Migration:** `npm run supabase:migration:new init_schema`. Add schema SQL (Section 4) to this file.
11. **Apply Migration Locally:** `npm run supabase:reset`. Verify schema changes in local DB (Studio URL from `supabase status`, e.g., `http://127.0.0.1:54333` if ports were changed).

### 3.2. Netlify Configuration

1.  **Create Git Repository & Push Initial Code.**
2.  **Create Netlify Site:** Connect Netlify to your Git repo. Configure build settings (usually auto-detected from `netlify.toml`):
    *   Build Command: `npm install && npm install --prefix client && cd client && npx vite build && cd ..` (Current setting after troubleshooting, see Section 5.5)
    *   Publish dir: `client/dist`
    *   Functions dir: `functions/`
3.  **Configure Production Env Vars:** In Netlify Site → Site configuration → Build & deploy → Environment variables. Add **Production** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`. **Handle `SERVICE_ROLE_KEY` securely - consider storing it as a sensitive variable.** Scope appropriately (Builds, Functions, Runtime).
4.  **Link Local Project:** `netlify link`. Connect to the created site.
5.  **Verify Local Netlify Dev:** Run `npm run dev`. Check that Netlify Dev starts on port 8888, proxies the Vite frontend (port 5173), and serves function endpoints (`/graphql`, `/api/inngest`).

### 3.3. Inngest Configuration

1.  **Create Inngest Account & Get Keys.**
2.  **Add Keys to Netlify Production Env Vars** (Done in 3.2).
3.  **Add Keys to Local `.env` file** (Done in 3.1).
4.  **Deploy Inngest Handler:** The `functions/inngest/index.ts` needs to be deployed for Inngest Cloud to discover functions. Run `npm run dev` locally and use the Inngest Dev Server (`npx inngest-cli dev -u http://localhost:8888/api/inngest`) or deploy to Netlify.

## 4. Database Schema & Conventions

*   **Migrations:** Manage all schema changes via Supabase migration files (`supabase/migrations/*.sql`). Create using `npm run supabase:migration:new <name>`. Apply locally using `npm run supabase:reset`.
*   **Naming Conventions:**
    *   SQL (Tables, Columns): Use `snake_case`.
    *   GraphQL (Types, Fields): Use `camelCase` (or `PascalCase` for Types). Leverage GraphQL Code Generator for mapping.
*   **RLS:** **Enable RLS on all tables** containing user or sensitive data (`ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;`). Define policies based on `auth.uid()` for ownership (`CREATE POLICY ... USING (auth.uid() = owner_id)`). Start simple, add complexity (e.g., team access) later. **Verify policies** during testing.
*   **Function Security:**
    *   Default to `SECURITY INVOKER` for functions called by users/GraphQL gateway to respect RLS.
    *   Use `SECURITY DEFINER` **only** when absolutely necessary (e.g., internal admin tasks accessing multiple users' data) and **document the justification**. Be extremely careful with `SECURITY DEFINER`.
    *   Always include `SET search_path = public;` (or a more restrictive path if applicable) at the start of function definitions to prevent search path hijacking attacks.
*   **Foreign Keys:** Link `owner_id` or similar columns to `auth.users(id)`. Define appropriate `ON DELETE` behavior (e.g., `SET NULL`, `CASCADE`). Consider implications for GDPR erasure.
*   **Indexes:** Create indexes for frequently queried columns, especially foreign keys (`owner_id`, linked entity IDs) and columns used in `WHERE` clauses for filtering/sorting.

## 5. Implementation Patterns

### 5.1. GraphQL Gateway (`functions/graphql-gateway`)

*   **Server:** Use Apollo Server v4 (`@apollo/server`). The integration packages (`@as-integrations/*`, `apollo-server-lambda`) proved difficult with Netlify Functions; a manual handler using `server.executeOperation` is used instead.
*   **Schema Definition:** Define schema in `.graphql` files (`schema.graphql`). Use GraphQL Code Generator (`npm run gql:codegen`) to generate TS types (`lib/gql-types.ts`).
*   **Resolvers:** Implement resolvers (`resolvers.ts`) matching generated types.
    *   **Context (`context.ts`):** Define `MyContext` interface. Use the context function to:
        1.  Create `supabaseClient` using `createServerClient` from `@supabase/ssr`.
        2.  Extract JWT from `event.headers.authorization` (preferred) or session cookie.
        3.  **Authenticate:** Validate JWT/cookie and fetch user using `supabaseClient.auth.getUser()`. Attach `currentUser` (or null) to context.
        4.  Provide `supabaseClient` and `currentUser` to resolvers.
    *   **Delegation:** Resolvers should delegate non-trivial business logic, validation, and complex database interactions to dedicated backend logic modules (`lib/...`). Simple fetches/updates might interact with `context.supabaseClient` directly.
    *   **Authorization:** Perform authorization checks within resolvers based on `context.currentUser` (e.g., `if (context.currentUser?.id !== resource.owner_id) throw new GraphQLError('Not authorized')`) *before* performing actions or returning data, complementing RLS.
    *   **Input Validation:** Use a library like `zod` to validate mutation arguments at the beginning of resolver functions. Define schemas matching GraphQL inputs.
    *   **Error Handling:** Catch errors from backend logic/Supabase. Map known errors (validation, not found, unauthorized) to specific `GraphQLError` instances with appropriate extensions. Avoid leaking sensitive error details.
*   **Security (See Section 6 & ADR):** Implement Rate Limiting, Query Depth Limiting, Query Complexity Analysis. Disable introspection in production. Consider APQ/Whitelisting.

```typescript
// Example: functions/graphql-gateway/context.ts
// (Ensure this matches the actual implementation using @supabase/ssr and cookie/header handling)
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { HandlerEvent, HandlerContext } from '@netlify/functions';
import type { SupabaseClient, User } from '@supabase/supabase-js';

// Define Database types...
interface Database { public: { /* ... */ } }

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export interface MyContext {
  supabaseClient: SupabaseClient<Database>;
  currentUser: User | null;
}

export async function createContext({ event }: { event: HandlerEvent; context: HandlerContext }): Promise<MyContext> {
  // ... (Implementation as created previously, handling cookies/token) ...
  // Parse cookies
  const parsedCookies = parseCookieHeader(event.headers.cookie || '');
  const cookieStore: Record<string, string> = parsedCookies.reduce((acc, cookie) => {
      if (cookie.value !== undefined) acc[cookie.name] = cookie.value;
      return acc;
  }, {} as Record<string, string>);

  // Create client
  const supabaseClient = createServerClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      cookies: {
          get: (name: string) => cookieStore[name],
          set: () => { /* noop */ },
          remove: () => { /* noop */ },
      },
  });

  // Get user from token or cookie
  let currentUser: User | null = null;
  const token = event.headers.authorization?.split('Bearer ')[1];
  if (token) {
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      currentUser = user;
  } else if (event.headers.cookie) {
      const { data: { user } } = await supabaseClient.auth.getUser();
      currentUser = user;
  }

  return { supabaseClient, currentUser };
}
```

```typescript
// Example: functions/graphql-gateway/graphql-gateway.ts (Manual Handler)
import { ApolloServer } from '@apollo/server';
import type { Handler, HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions';
import { readFileSync } from 'fs';
import path from 'path';
import { resolvers } from './resolvers';
import { createContext, MyContext } from './context';

// Helper function to parse request body
function parseRequestBody(body: string | null, isBase64Encoded: boolean): any { /* ... as implemented ... */ }

// Load schema
let typeDefs: string; /* ... as implemented ... */

// Initialize server
const server = new ApolloServer<MyContext>({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== 'production',
});

// Main Netlify Function handler
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext): Promise<HandlerResponse> => {
    if (event.httpMethod === 'GET') {
        // Handle GET (e.g., health check)
        return { statusCode: 200, body: 'Gateway OK', headers: { 'Content-Type': 'text/plain' } };
    }
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers: { 'Allow': 'POST, GET' } };
    }

    try {
        const operation = parseRequestBody(event.body, event.isBase64Encoded);
        if (!operation || !operation.query) { /* Handle error */ }

        const requestContext = await createContext({ event, context });

        const response = await server.executeOperation(
            { query: operation.query, variables: operation.variables, operationName: operation.operationName },
            { contextValue: requestContext }
        );

        if (response.body.kind === 'single') {
            return {
                statusCode: 200,
                body: JSON.stringify(response.body.singleResult),
                headers: { 'Content-Type': 'application/json' }
            };
        } else { /* Handle other response kinds if necessary */ }

    } catch (error: unknown) { /* Handle error */ }

    // Default error response if other handlers didn't return
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error' }), headers: { 'Content-Type': 'application/json' } };
};

// Add back implementations for parseRequestBody and schema loading logic...
function parseRequestBody(body: string | null, isBase64Encoded: boolean): any {
    if (!body) { return null; }
    try {
        const decodedBody = isBase64Encoded ? Buffer.from(body, 'base64').toString('utf8') : body;
        return JSON.parse(decodedBody);
    } catch (e) { return null; }
}
try {
    const schemaPath = path.resolve(process.cwd(), 'functions', 'graphql-gateway', 'schema.graphql');
    typeDefs = readFileSync(schemaPath, 'utf8');
} catch (err) { throw new Error('Could not load GraphQL schema file.'); }
```

### 5.2. Backend Logic Modules (`lib/`)

*   **Purpose:** Encapsulate domain-specific business logic, validation rules (using `zod`), and database interactions.
*   **Structure:** Organize by domain (e.g., `lib/customer-data/`, `lib/deals/`).
*   **Exports:** Export async functions (e.g., `createOrganization`, `getDealsByUser`).
*   **Inputs:** Functions should accept necessary inputs like `supabase: SupabaseClient`, `user: User`, and validated data payloads (e.g., `input: CreateOrgInput`).
*   **Interaction:** Imported and called by GraphQL Gateway resolvers. Resolvers handle auth context and pass necessary info.
*   **Error Handling:** Throw specific, catchable errors (e.g., `ValidationError`, `NotFoundError`, `AuthorizationError`) for resolvers to handle appropriately.

```typescript
// Example: lib/customer-data/organizations.ts
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '../db-types'; // Assuming Supabase generated types

// Input validation schema
export const CreateOrgSchema = z.object({
  name: z.string().min(1, 'Organization name is required.'),
  website: z.string().url().optional(),
  // ... other fields
});
export type CreateOrgInput = z.infer<typeof CreateOrgSchema>;

// Define custom error types if needed
export class OrgServiceError extends Error { /* ... */ }
export class OrgValidationError extends OrgServiceError { /* ... */ }
export class OrgNotFoundError extends OrgServiceError { /* ... */ }

export async function createOrganizationLogic(
  supabase: SupabaseClient<Database>,
  user: User,
  input: CreateOrgInput
) {
  // Validation should happen in the resolver before calling this,
  // but can add redundant checks here if desired.

  // Complex business logic / checks can go here

  const { data, error } = await supabase
    .from('organizations') // Use generated types for table names
    .insert({ name: input.name, website: input.website, owner_id: user.id })
    .select()
    .single();

  if (error) {
    console.error('DB Error (createOrganizationLogic):', error);
    // Consider mapping DB errors (e.g., unique constraint) to specific service errors
    throw new OrgServiceError(`Failed to create organization: ${error.message}`);
  }
  if (!data) {
      throw new OrgNotFoundError('Failed to retrieve organization after creation.');
  }
  return data;
}
```

### 5.3. Frontend (`client/`)

*   **Setup:** Initialize as a Vite project: `npm create vite@latest client --template react-ts`.
    *   **Troubleshooting:** If the `client` directory already exists (e.g., from initial setup), Vite will prompt. Either choose "Remove existing files" or manually `rm -rf client` before running the command.
*   **Dependencies:** Install base dependencies via Vite init. Then, install required project dependencies within the `client/` directory:
    ```bash
    cd client
    # Core dependencies
    npm install @apollo/client@^3 @chakra-ui/react@^3 @emotion/react@^11 @supabase/ssr react-router-dom@^6 graphql@^16
    # Note: @supabase/ssr is required for client-side auth with SSR/Vite compatibility, replacing deprecated @supabase/auth-helpers-react
    
    # Development dependencies (Vite handles most, add others as needed)
    # Example: npm install -D @types/react@^18 @types/react-dom@^18 ...
    cd ..
    ```
*   **API Client:** Use Apollo Client (`@apollo/client`). Configure `ApolloProvider` and client instance in `src/main.tsx` (Vite entry point) or a dedicated `src/apollo-client.ts`.
    *   *Note: `ApolloProvider` is currently commented out in `main.tsx` due to a Netlify build issue (See Section 5.5).*
*   **Authentication:** Use `@supabase/ssr` (`createBrowserClient`) for the Supabase client (`src/supabase-client.ts`). Manage auth state with React context (`src/context/AuthContext.tsx`) and custom hook (`src/hooks/useAuth.tsx`).
    *   *Note: `AuthProvider` is currently commented out in `main.tsx` due to a Netlify build issue (See Section 5.5).*
*   **Authentication Link (`src/apollo-client.ts`):** Use `@apollo/client/link/context` to set the `Authorization` header. Fetch the Supabase session asynchronously using `supabase.auth.getSession()` within the `setContext` function.
*   **Data Fetching:** Use hooks generated by GraphQL Code Generator (`src/gql/`). Fallback to manual `useQuery`, `useMutation` with imported `gql` tag or `.graphql` files.
*   **Code Generation (`client/codegen.ts` or root `codegen.ts`):** Configure GraphQL Code Generator (`@graphql-codegen/cli`) to generate typed hooks/operations based on schema and frontend `.graphql` files. Run via `npm run gql:codegen`.
*   **State Management:** Use Apollo Client cache for server state. Zustand or Jotai are good lightweight options for global UI state if React Context becomes unwieldy.
*   **Environment Variables:** Access `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` via `import.meta.env.VITE_...`. Ensure they are populated in the root `.env` file.
*   **Testing:** Use Vitest (Vite's testing framework) with React Testing Library (`@testing-library/react`). Add `npm test --prefix client` scripts to root `package.json`.

### 5.4. Chakra UI v3 Setup & Troubleshooting

During initial setup, we encountered TypeScript errors when trying to wrap the application with `<ChakraProvider>` in `client/src/main.tsx`. The error typically looked like: `Property 'children' does not exist on type 'IntrinsicAttributes & ChakraProviderProps'`.

**Root Cause:** We had installed `@chakra-ui/react@^3`, which is the newer **Chakra UI v3**. This version introduced breaking changes compared to v2, particularly around the provider setup.

**Key Changes & Fixes for v3:**

1.  **Dependencies:** Chakra UI v3 **does not** require `@emotion/styled` or `framer-motion`. These were uninstalled:
    ```bash
    npm uninstall --prefix client @emotion/styled framer-motion
    ```
2.  **Provider Setup (`client/src/main.tsx`):**
    *   The `<ChakraProvider>` component no longer accepts a `theme` prop.
    *   It now requires a `value` prop, which expects a `system` object.
    *   The fix involves importing `defaultSystem` from `@chakra-ui/react` and passing it to the `value` prop:

    ```typescript
    // client/src/main.tsx (Relevant parts)
    import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
    // ... other imports

    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <ApolloProvider client={client}>
          <ChakraProvider value={defaultSystem}> {/* <-- Correct v3 setup */}
            <App />
          </ChakraProvider>
        </ApolloProvider>
      </React.StrictMode>,
    );
    ```

*Refer to the [Chakra UI v3 Migration Guide](https://www.chakra-ui.com/docs/get-started/migration) for more details on v2 to v3 changes.*

### 5.5 Netlify Build Issue & Workaround (Ongoing)

**Status:** As of [Current Date - e.g., Nov 27, 2024], Netlify builds are **failing** when attempting to import local `.ts`/`.tsx` modules that depend (directly or indirectly) on `@supabase/ssr`.

**Symptom:** The Vite build process (`npx vite build`) run by Netlify fails with an `ENOENT` (Error: No Entity / File Not Found) error when trying to load files like `client/src/apollo-client.ts` or `client/src/context/AuthContext.tsx`, even though the files exist and path aliases (`@/`) are configured.

**Example Error:**
```
[vite:load-fallback] Could not load /opt/build/repo/client/src/context/AuthContext.tsx (imported by src/main.tsx): ENOENT: no such file or directory, open '/opt/build/repo/client/src/context/AuthContext.tsx'
```

**Diagnosis:**
*   The build *succeeds* when these local imports are commented out.
*   The build *succeeds* when importing a simple local module (`dummy.ts`) that *doesn't* import `@supabase/ssr`.
*   The issue seems specific to the interaction between Vite/Rollup, the `@supabase/ssr` package (or its dependencies), and the Netlify build environment. Local builds (`npm run dev`, `npm run build --prefix client`) work correctly.

**Current Workaround (Temporary):**
To allow Netlify deployments/previews to succeed for other parts of the application, the following are currently **commented out** in `client/src/main.tsx`:
*   `import { ApolloProvider } ...`
*   `import { client } ...`
*   `import { AuthProvider } ...`
*   The `<ApolloProvider>` wrapper component.
*   The `<AuthProvider>` wrapper component.

**Consequence:** Deployed previews and the production site currently **do not have functional authentication or GraphQL API integration**. This must be resolved before Phase 1 goals can be fully met.

**Troubleshooting Steps Taken:**
*   Verified file paths and casing.
*   Ensured `@supabase/ssr` is explicitly installed in `client/package.json`.
*   Tried various build command invocations in `netlify.toml` (`npm run build --prefix client`, `cd client && vite build`, `cd client && npx vite build`). Current: `cd client && npx vite build && cd ..`.
*   Tried relative paths vs. aliases (`@/`) for imports.
*   Tried explicitly adding file extensions (`.ts`, `.tsx`) to imports.
*   Defined alias (`@/`) explicitly in `vite.config.ts` and `tsconfig.app.json`.
*   Enabled Vite info logging (provided no additional insight before the crash).

**Next Steps:** Revisit this issue. Potential avenues include deeper Vite/Rollup debugging, checking for known issues with `@supabase/ssr` in specific environments, or considering alternative build configurations/tools if the issue persists.

## 6. Security Practices

*   **Authentication:** Enforce JWT authentication at the GraphQL Gateway for all relevant queries/mutations.
*   **Authorization:** Check permissions in GraphQL resolvers (using `context.currentUser`) *before* accessing data or calling backend logic. Complement with database RLS.
*   **Input Validation:** **Mandatory:** Use `zod` (or similar) in resolvers to validate *all* mutation arguments against strict schemas before processing.
*   **GraphQL Security Measures:**
    *   **Mandatory:** Implement Query Depth Limiting (e.g., `graphql-depth-limit`).
    *   **Mandatory:** Implement Query Complexity Analysis (e.g., `graphql-query-complexity`).
    *   **Mandatory:** Disable GraphQL Introspection & Playground in production environments.
    *   **Recommended:** Consider Automatic Persisted Queries (APQ) or Operation Whitelisting for production to prevent arbitrary query execution.
*   **RLS:** Apply Supabase Row Level Security policies as a fundamental security layer in the database. **Test RLS policies thoroughly.**
*   **Secrets Management:**
    *   Use `.env`

### 6.2. Frontend Build & Deployment Troubleshooting (Netlify)

*   **Initial Build Failures (Setup Phase):**
    *   Ensure `client/package.json` exists and is committed.
    *   Ensure `netlify.toml` build command includes `npm install` for both root and `client` (`npm install && npm install --prefix client && npm run build --prefix client`).

*   **Persistent `ENOENT` / `Could not resolve` Build Errors (During Development):**
    *   **Symptom:** Netlify build fails with errors like `ENOENT: no such file or directory` or `Could not resolve './path/to/module'` for files (e.g., `apollo-client.ts`, `AuthContext.tsx`) imported within the client application, even though the build works locally.
    *   **Investigation:**
        *   Initial troubleshooting focused on import paths (relative vs. alias `@/...`, with/without extensions) and Vite configuration (`ssr.noExternal`, `allowImportingTsExtensions`, `moduleResolution: 'bundler'`). These changes did not resolve the core issue.
        *   A React 18 vs 19 peer dependency conflict was identified (`ERESOLVE` warnings in build logs) due to `@apollo/client` and `@chakra-ui/react` requiring React 18 while React 19 was installed. This was resolved by ensuring React 18 was specified in `client/package.json` and forcing a clean install in the Netlify build command (`rm -rf client/node_modules client/package-lock.json && npm install --prefix client`).
    *   **Root Cause:** The primary cause appeared to be that critical source files (`apollo-client.ts`, `AuthContext.tsx`, `useAuth.tsx`) were not correctly tracked by Git and therefore missing in the Netlify build environment. `git status` or `git add .` might not have caught untracked files in subdirectories if `.gitignore` was overly broad or if files were added after initial commits without explicit `git add <path>`. Git reporting `create mode` for these files during later commits confirmed they were newly tracked.
    *   **Resolution:**
        1.  Verify all necessary source files within `client/src/` are correctly added and committed to Git (`git add client/src/<path>/<file>` and `git commit`).
        2.  Use consistent import aliases (`@/...`) for imports within the `client/src` directory, as defined in `client/vite.config.ts` and `client/tsconfig.app.json`. Using relative paths also worked but aliases are preferred for consistency.
        3.  Ensure React versions align with library peer dependencies (React 18 was required here).
        4.  Include a clean install step in the Netlify build command (`rm -rf client/node_modules client/package-lock.json && npm install --prefix client`) to prevent stale dependencies from causing issues.

*   **Chakra UI v3 Build/Type Errors:**
    *   If using Chakra UI v3 (`@chakra-ui/react@^3`), ensure the correct provider setup in `main.tsx`: `<ChakraProvider value={defaultSystem}>`. Remove unused v3 dependencies (`@emotion/styled`, `framer-motion`). Address prop changes (e.g., `gap` instead of `spacing`, use component slots like `Alert.Root`).

## 7. Project Structure Overview (Conceptual)

```
.