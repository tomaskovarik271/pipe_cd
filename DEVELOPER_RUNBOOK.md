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
    mkdir -p client/src client/public
    mkdir -p supabase/migrations
    # Add .keep files to empty directories to ensure they are committed
    touch functions/graphql-gateway/.keep functions/inngest/.keep
    touch lib/customer-data/.keep lib/deals/.keep lib/activities/.keep
    touch client/src/.keep client/public/.keep
    ```

5.  **Install Core Backend & Gateway Dependencies (Root `package.json`):**
    ```bash
    # Runtime dependencies (Stable versions)
    npm install @apollo/server@^4 @as-integrations/netlify@^3 graphql@^16 graphql-tag@^2 # Gateway
    npm install @supabase/supabase-js@^2 @supabase/auth-helpers-node@^1 # Supabase
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
      # Command to build the frontend client
      command = "npm run build --prefix client"
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
      framework = "#vite"
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
3.  **Start Local Supabase Instance:** Run `npm run supabase:start`. Verify Docker containers start correctly. **Troubleshooting:** Use `npm run supabase:stop` or `npm run supabase:stop:all` if port conflicts occur.
4.  **Get Local API Credentials:** Run `npm run supabase:status`. Note the local `API URL`, `anon key`, and `service_role key`.
5.  **Configure Local Environment (`.env`):** Run `npm run setup:env` then **populate `.env`** with the local keys from `supabase status` and your Inngest keys. Match `SUPABASE_*` and `VITE_SUPABASE_*` vars.
6.  **Configure Auth Providers (Production):** In Supabase Dashboard → Authentication → Providers. **Toggle ON** required providers (e.g., Email). Add required redirect URLs.
7.  **Configure URLs (Production):** In Supabase Dashboard → Authentication → URL Configuration. Set **Site URL** (production Netlify URL) and **Redirect URLs** (add `http://localhost:8888` for Netlify Dev, plus production URL).
8.  **Configure Email Templates (Production):** Customize as needed.
9.  **Link Local Project (Optional but Recommended):** `supabase link --project-ref <prod-project-ref>` (requires DB password). Helps with pulling remote schema changes.
10. **Prepare Initial Migration:** `npm run supabase:migration:new init_schema`. Add schema SQL (Section 4) to this file.
11. **Apply Migration Locally:** `npm run supabase:reset`. Verify schema changes in local DB (Studio: `http://localhost:54323`).

### 3.2. Netlify Configuration

1.  **Create Git Repository & Push Initial Code.**
2.  **Create Netlify Site:** Connect Netlify to your Git repo. Configure build settings (usually auto-detected from `netlify.toml`): Command `npm run build --prefix client`, Publish dir `client/dist`, Functions dir `functions/`.
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

*   **Server:** Use Apollo Server v4 with `@as-integrations/netlify`.
*   **Schema Definition:** Define schema in `.graphql` files (`schema.graphql`). Use GraphQL Code Generator (`npm run gql:codegen`) to generate TS types (`lib/gql-types.ts`).
*   **Resolvers:** Implement resolvers (`resolvers.ts`) matching generated types.
    *   **Context (`context.ts`):** Define `MyContext` interface. Use the context function to:
        1.  Create `supabaseClient` using `createServerClient` from `@supabase/auth-helpers-node`.
        2.  Extract JWT from `event.headers.authorization`.
        3.  **Authenticate:** Validate JWT and fetch user using `supabaseClient.auth.getUser()`. Attach `currentUser` (or null) to context.
        4.  Provide `supabaseClient` and `currentUser` to resolvers.
        *Optimization:* Consider decoding JWT directly for claims if `getUser()` proves too slow, but `getUser()` validates the token against Supabase.
    *   **Delegation:** Resolvers should delegate non-trivial business logic, validation, and complex database interactions to dedicated backend logic modules (`lib/...`). Simple fetches/updates might interact with `context.supabaseClient` directly.
    *   **Authorization:** Perform authorization checks within resolvers based on `context.currentUser` (e.g., `if (context.currentUser?.id !== resource.owner_id) throw new GraphQLError('Not authorized')`) *before* performing actions or returning data, complementing RLS.
    *   **Input Validation:** Use a library like `zod` to validate mutation arguments at the beginning of resolver functions. Define schemas matching GraphQL inputs.
    *   **Error Handling:** Catch errors from backend logic/Supabase. Map known errors (validation, not found, unauthorized) to specific `GraphQLError` instances with appropriate extensions. Avoid leaking sensitive error details.
*   **Security (See Section 6 & ADR):** Implement Rate Limiting, Query Depth Limiting, Query Complexity Analysis. Disable introspection in production. Consider APQ/Whitelisting.

```typescript
// Example: functions/graphql-gateway/context.ts
import { createServerClient, type SupabaseClient, type User } from '@supabase/auth-helpers-node';
import type { HandlerEvent } from '@netlify/functions';

// Environment Variables
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

// Match interface used in codegen.ts
export interface MyContext {
  supabaseClient: SupabaseClient;
  currentUser: User | null;
  // Add other context items if needed (e.g., Inngest client)
}

export async function createContext({ event }: { event: HandlerEvent }): Promise<MyContext> {
  const supabaseClient = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    getHeader: (headerName) => event.headers[headerName.toLowerCase()],
    // Add cookie options if needed
  });

  const { data: { user } } = await supabaseClient.auth.getUser();

  return { supabaseClient, currentUser: user };
}
```

```typescript
// Example: functions/graphql-gateway/graphql-gateway.ts (Handler setup)
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNetlifyHandler } from '@as-integrations/netlify';
import { readFileSync } from 'fs';
import path from 'path';
import { resolvers } from './resolvers'; // Implement resolvers
import { createContext, MyContext } from './context';

// Load schema generated by codegen or defined manually
const typeDefs = readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8');

const server = new ApolloServer<MyContext>({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== 'production',
});

export const handler = startServerAndCreateNetlifyHandler(server, {
  context: createContext,
});
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
*   **Dependencies:** Install dependencies within the `client/` directory: `npm install @apollo/client graphql @chakra-ui/react @emotion/react @emotion/styled framer-motion @supabase/auth-helpers-react @supabase/supabase-js react-router-dom` and dev deps (`@graphql-codegen/cli`, etc. if managing codegen separately).
*   **API Client:** Use Apollo Client (`@apollo/client`). Configure `ApolloProvider` and client instance in `src/main.tsx` (Vite entry point) or a dedicated `src/apollo-client.ts`.
*   **Authentication Link (`src/apollo-client.ts`):** Use `@apollo/client/link/context` to set the `Authorization` header. **Crucially, fetch the Supabase session *asynchronously* within the `setContext` function** before returning headers.

```typescript
// Example: client/src/apollo-client.ts
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { supabase } from './supabase-client'; // Your Supabase client instance

const httpLink = createHttpLink({
  uri: '/graphql', // Netlify Dev proxies this
});

const authLink = setContext(async (_, { headers }) => {
  // Get the *current* session async
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  }
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
```

*   **Data Fetching:** Use hooks generated by GraphQL Code Generator (`src/gql/`). Fallback to manual `useQuery`, `useMutation` with imported `gql` tag or `.graphql` files.
*   **Code Generation (`client/codegen.ts` or root `codegen.ts`):** Configure GraphQL Code Generator (`@graphql-codegen/cli`) to generate typed hooks/operations based on schema and frontend `.graphql` files. Run via `npm run gql:codegen`.
*   **State Management:** Use Apollo Client cache for server state. Zustand or Jotai are good lightweight options for global UI state if React Context becomes unwieldy.
*   **Environment Variables:** Access `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` via `import.meta.env.VITE_...`. Ensure they are populated in the root `.env` file.
*   **Testing:** Use Vitest (Vite's testing framework) with React Testing Library (`@testing-library/react`). Add `npm test --prefix client` scripts to root `package.json`.

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
    *   Use `.env` (gitignored) for local development secrets.
    *   Use Netlify Environment Variables for production secrets. Mark `SUPABASE_SERVICE_ROLE_KEY` and `INNGEST_SIGNING_KEY` as **sensitive values**.
    *   **Never** expose `SUPABASE_SERVICE_ROLE_KEY` or other backend-only secrets to the frontend/browser.
*   **Dependencies:** Regularly audit dependencies (`npm audit`) and update promptly. Use tools like Dependabot.
*   **Rate Limiting:** Consider adding rate limiting at the Netlify Edge or within the GraphQL gateway if abuse becomes likely.
*   **Function Security:** Use `SECURITY INVOKER` for PG functions unless `DEFINER` is strictly justified and understood. Use `search_path` protection.

## 7. Testing Strategy

*   **Backend Logic (`lib/`) - Unit Tests:**
    *   Use Jest (or Vitest if preferred). Test individual functions, mocking Supabase client (`jest.fn()`, `mockResolvedValue`) and other dependencies.
    *   Focus on business logic, validation, and edge cases.
*   **GraphQL Gateway (`functions/graphql-gateway`) - Integration Tests:**
    *   Use Jest/Supertest or a dedicated GraphQL testing library (`@apollo/server/testing`).
    *   Spin up Apollo Server instance in tests.
    *   Send actual GraphQL queries/mutations.
    *   Mock the context creation function (`createContext`) to provide controlled `currentUser` and mocked `supabaseClient` or backend logic modules.
    *   Test resolver logic, auth checks, error mapping, and integration with mocked backend modules.
    *   *Advanced:* Test against a *real* local Supabase instance (via Docker) for full integration tests verifying RLS (can be slower, run separately/less frequently).
*   **Frontend (`client/`) - Component/Unit Tests:**
    *   Use Vitest + React Testing Library.
    *   Test individual components, mocking props and context.
    *   For components using Apollo hooks, use `MockedProvider` from `@apollo/client/testing` to simulate GraphQL responses.
    *   Test component rendering, state changes, and event handlers.
*   **End-to-End (E2E) Tests:**
    *   Use Playwright or Cypress.
    *   Run against the full local stack (`npm run dev`).
    *   Test critical user flows (e.g., Login -> Create Org -> View Org List).
    *   Keep E2E tests focused on high-level flows; avoid testing detailed component logic.
*   **CI Pipeline (GitHub Actions Example):**
    ```yaml
    # .github/workflows/ci.yml (Simplified)
    name: CI Pipeline
    on: [push, pull_request]
    jobs:
      lint-typecheck-test:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v3
          - uses: actions/setup-node@v3
            with:
              node-version: '18'
              cache: 'npm'
          - name: Install Root Dependencies
            run: npm ci
          - name: Install Client Dependencies
            run: npm ci --prefix client
          - name: Lint
            run: npm run lint
          - name: Type Check
            run: npm run typecheck
          - name: Backend Tests
            run: npm test
          - name: Frontend Tests
            run: npm test --prefix client
      # Add build job, E2E test job (potentially requires starting services)
    ```

## 8. Development Workflow

1.  **Setup:** Clone repo, `npm install`, `npm install --prefix client`, `npm run setup:env`.
2.  **Start Local Supabase:** `npm run supabase:start`.
3.  **Get/Update Local Keys:** `npm run supabase:status` -> Update `.env` with Supabase & Inngest keys.
4.  **Schema Changes:** Create migration (`npm run supabase:migration:new <name>`), edit SQL file, apply (`npm run supabase:reset`).
5.  **Start Dev Server:** `npm run dev`.
6.  **Access:** Frontend (`http://localhost:5173`), Full Site/Gateway (`http://localhost:8888`), GraphQL (`http://localhost:8888/graphql`), Supabase Studio (`http://localhost:54323`).
7.  **GraphQL Changes:** Modify `schema.graphql`, run `npm run gql:codegen`.
8.  **Code & Test:** Implement features in `client/`, `lib/`, `functions/`. Write corresponding tests.
9.  **Run Tests:** `npm test` (backend), `npm test --prefix client` (frontend).
10. **Commit & Push:** Follow standard Git workflow.
11. **Stopping:** `npm run supabase:stop` or `npm run supabase:stop:all`.

## 9. Monitoring & Observability

*   **Logging:** Implement structured logging (e.g., using `pino`) in Netlify Functions (Gateway, Inngest). Ensure logs are captured by Netlify.
*   **Tracing:** *Research:* Explore configuring OpenTelemetry auto-instrumentation for Netlify Functions if detailed tracing is needed. Send traces to an observability platform (e.g., Honeycomb, Datadog, SigNoz).
*   **Error Tracking:** **Recommended:** Integrate Sentry (`@sentry/node`, `@sentry/react`) or similar service in both frontend and backend/gateway functions to capture and report errors.
*   **GraphQL Monitoring:** Use Apollo Studio (Explorer works locally, consider paid plans for production metrics) or inspect logs for query performance/errors.
*   **Supabase Monitoring:** Utilize the Supabase Dashboard for database performance, query analysis, and logs.
*   **Netlify Analytics/Monitoring:** Leverage built-in Netlify tools for function invocation counts, latency (including cold starts), error rates, and basic analytics.
*   **Alerting:** Set up alerts (e.g., via monitoring platform or Netlify) for critical errors, high latency spikes (esp. gateway p95), or high function execution rates.

## 10. Compliance & Data Handling

*   **Data Erasure (GDPR Right to be Forgotten):** **Required:**
    *   Design a robust workflow. Recommended approach: Use an Inngest function triggered by Supabase Auth `user.deleted` webhook or a manual admin action.
    *   The workflow *must*: Delete the user record from `auth.users` (if not done by trigger), delete related records in all application tables (using `owner_id`), and delete associated files from Supabase Storage.
    *   Document this process clearly.
    *   Test this workflow thoroughly.
*   **Data Residency:** Confirm requirements. Choose Supabase project region accordingly. Verify Netlify function execution regions if strict residency is mandatory.
*   **Data Access/Portability:** Ensure GraphQL queries and RLS allow users to access their data as required by regulations.

## Appendix A: Environment Variable Reference

*(Table updated slightly for clarity)*

| Variable Name             | Source                   | Used By                                  | Local Value Source      | Sensitive | Notes |
|---------------------------|--------------------------|------------------------------------------|-------------------------|-----------|-------|
| `SUPABASE_URL`            | Supabase                 | Netlify Funcs (Backend), Netlify Dev Env | `supabase status`       | No        | Public URL |
| `SUPABASE_ANON_KEY`         | Supabase                 | Netlify Funcs (Backend), Netlify Dev Env | `supabase status`       | No        | Public Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase                 | Netlify Funcs (Backend - **Use Sparingly**) | `supabase status`       | **Yes**   | **Never expose to frontend** |
| `VITE_SUPABASE_URL`       | Supabase (match `SUPABASE_URL`) | Frontend Client (Vite Build/Dev)         | Value from `SUPABASE_URL` | No        | Exposed to browser |
| `VITE_SUPABASE_ANON_KEY`    | Supabase (match `SUPABASE_ANON_KEY`) | Frontend Client (Vite Build/Dev)         | Value from `SUPABASE_ANON_KEY` | No    | Exposed to browser |
| `INNGEST_EVENT_KEY`       | Inngest                  | Netlify Funcs (To send events)           | Inngest Dashboard       | No        | Public Key |
| `INNGEST_SIGNING_KEY`     | Inngest                  | Inngest Handler Function (Verify webhook) | Inngest Dashboard       | **Yes**   | Keep Secret |

## Appendix B: Useful Commands

*(Updated with codegen, typecheck, migration commands)*

```bash
# Install all dependencies (root and client)
npm install && npm install --prefix client

# Setup local .env file (run once)
npm run setup:env

# Start local development environment (Supabase + Netlify Dev)
npm run supabase:start && npm run dev

# Stop local development environment
npm run supabase:stop # Or supabase:stop:all

# Reset local database and apply all migrations
npm run supabase:reset

# Check local Supabase status (Get URLs/Keys for .env)
npm run supabase:status

# Create a new database migration file
npm run supabase:migration:new <migration_name>

# Link local project to Netlify site (run once)
netlify link

# Run linters
npm run lint

# Check TypeScript types
npm run typecheck

# Run backend tests
npm test

# Run backend tests in watch mode
npm test:watch

# Run frontend tests (Vitest)
npm test --prefix client

# Generate GraphQL types/hooks
npm run gql:codegen
```

--- 