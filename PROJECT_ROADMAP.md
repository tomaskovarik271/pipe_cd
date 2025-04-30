# Project Roadmap: Custom CRM System

**Version:** 0.1 | **Date:** 2025-05-01

This document outlines the proposed roadmap for building the Custom CRM System. It breaks down the work into logical phases and includes key milestones, feature epics, and tasks related to architectural decisions and risk mitigation.

## Guiding Principles

*   **Iterative Delivery:** Deliver value incrementally.
*   **Feedback Loop:** Incorporate feedback after each major phase.
*   **Focus on Core CRM:** Prioritize core CRM functionality (Contacts, Organizations, Deals) before expanding.
*   **Technical Foundation First:** Ensure the core architecture, setup, and developer experience are solid before building extensive features.

## Phase 1: Foundation & Core Setup (Est. ~2-4 Sprints)

**Goal:** Establish the core technical foundation, local development workflow, CI/CD pipeline, and basic authentication.

**Key Milestones:**
*   Local development environment fully functional (`netlify dev`, `supabase start`).
*   Basic CI/CD pipeline operational (lint, test, deploy PR previews, deploy main to staging).
*   Users can sign up, log in, and log out.
*   GraphQL Gateway operational with basic schema and authentication.

**Epics/Features:**

1.  **Project Initialization & Configuration:**
    *   [x] Finalize monorepo structure.
    *   [x] Configure `netlify.toml`.
    *   [x] Configure Supabase locally (`supabase init`).
    *   [x] Set up root `package.json` with core scripts.
    *   [x] Set up `.gitignore`, `.env.example`.
2.  **Local Development Workflow:**
    *   [x] Ensure `npm run dev` works reliably.
    *   [x] Ensure `npm run supabase:start/stop/reset` works reliably.
    *   [x] Document local setup in `DEVELOPER_RUNBOOK.md`.
3.  **CI/CD Pipeline Setup:**
    *   [ ] Configure GitHub Actions (or chosen provider).
    *   [ ] Implement linting and backend unit tests in CI.
    *   [ ] Configure Netlify deployment for PR previews.
    *   [x] Configure Netlify deployment for `main` branch to a staging environment.
4.  **Authentication Setup (Supabase Auth):**
    *   [ ] Configure Supabase Auth providers (Email minimum).
    *   [ ] Configure Supabase Auth URLs & Email templates.
    *   [ ] Implement basic SignUp/Login/Logout UI components in the frontend (Vite/React).
    *   [ ] Implement Supabase JS client setup in frontend.
    *   [ ] Integrate Auth state with frontend routing (protected routes).
5.  **GraphQL Gateway Foundation:**
    *   [ ] Set up Apollo Server on Netlify Function (`functions/graphql-gateway`).
    *   [ ] Implement JWT authentication check in Apollo Server context.
    *   [ ] Define initial GraphQL schema (placeholder types, basic User query).
    *   [ ] Set up Apollo Client in the frontend (including auth link).
    *   [ ] Implement basic authenticated query from frontend (e.g., `getCurrentUser`).
6.  **Initial Database Schema & Migrations:**
    *   [ ] Create initial Supabase migration (`init_schema.sql`) for `users` table extensions (if needed) and basic RLS policy.
    *   [ ] Document migration process.

**Technical Tasks:**
*   [ ] Set up ESLint/Prettier configuration.
*   [ ] Set up basic Jest configuration for backend tests.
*   [x] Configure TypeScript (`tsconfig.json`) for backend/shared code.
*   [x] Set up Vite project for the frontend (`client/`).

## Phase 2: Core CRM Entities - Organizations & Contacts (Est. ~3-5 Sprints)

**Goal:** Implement CRUD functionality for Organizations and Contacts, including UI, GraphQL API, database schema, and basic testing.

**Key Milestones:**
*   Users can Create, Read, Update, and Delete Organizations.
*   Users can Create, Read, Update, and Delete Contacts.
*   Contacts can be linked to Organizations.
*   Basic UI implemented for managing Organizations and Contacts.
*   GraphQL schema reflects Organization/Contact models and relationships.
*   Database schema and RLS policies implemented for Organizations/Contacts.
*   Unit/Integration tests cover core CRUD operations.

**Epics/Features:**

1.  **Organization Management (CRUD):**
    *   [ ] Define `Organization` database schema (+ RLS). Create migration.
    *   [ ] Define `Organization` GraphQL type, queries (list, getById), mutations (create, update, delete).
    *   [ ] Implement resolvers for Organization CRUD, delegating logic to `lib/customer-data/organizations.ts`.
    *   [ ] Implement backend logic for Organization CRUD operations.
    *   [ ] Implement frontend UI components (List, Detail, Create/Edit Form) for Organizations.
    *   [ ] Integrate frontend UI with GraphQL queries/mutations using Apollo Client hooks.
2.  **Contact Management (CRUD):**
    *   [ ] Define `Contact` database schema (+ RLS). Create migration.
    *   [ ] Define `Contact` GraphQL type, queries, mutations.
    *   [ ] Implement resolvers for Contact CRUD (`lib/customer-data/contacts.ts`).
    *   [ ] Implement backend logic for Contact CRUD.
    *   [ ] Implement frontend UI components for Contacts.
    *   [ ] Integrate frontend UI with GraphQL.
3.  **Organization-Contact Linking:**
    *   [ ] Define relationship in database schema (e.g., `contact.organization_id` FK).
    *   [ ] Update GraphQL schema to reflect relationship (e.g., `Contact.organization`, `Organization.contacts`).
    *   [ ] Implement resolvers for relationship fields.
    *   [ ] Update UI to display and manage links (e.g., assign contact to org).
4.  **Testing:**
    *   [ ] Add backend unit tests for Organization/Contact logic modules.
    *   [ ] Add GraphQL integration tests for core CRUD operations.
    *   [ ] Add frontend component tests (Vitest/RTL) for Org/Contact UI.

**Technical Tasks:**
*   [ ] Set up GraphQL Code Generator (`npm run codegen`) and integrate into workflow.
*   [ ] Refine frontend state management for lists/details if needed.
*   [ ] Implement basic error handling and display in the frontend.
*   [ ] Implement basic loading states in the frontend.

## Phase 3: Core CRM Entities - Deals & Activities (Est. ~3-5 Sprints)

**Goal:** Implement CRUD for Deals and Activities, link them to Organizations/Contacts, and introduce basic async workflows.

**Key Milestones:**
*   Users can CRUD Deals and Activities.
*   Deals/Activities can be linked to Organizations/Contacts.
*   Basic Deal pipeline visualization (e.g., Kanban board).
*   Inngest configured and basic event published/handled.

**Epics/Features:**

1.  **Deal Management (CRUD & Pipeline):**
    *   [ ] Define `Deal` database schema (+ RLS, stages). Create migration.
    *   [ ] Define `Deal` GraphQL type, queries, mutations.
    *   [ ] Implement resolvers/logic (`lib/deals/deals.ts`).
    *   [ ] Implement frontend UI (List, Detail, Create/Edit Form).
    *   [ ] Implement basic Deal pipeline view (e.g., drag-and-drop board).
    *   [ ] Link Deals to Organizations/Contacts (DB schema, GraphQL, UI).
2.  **Activity Management (CRUD):**
    *   [ ] Define `Activity` database schema (+ RLS, types like Call, Email, Meeting). Create migration.
    *   [ ] Define `Activity` GraphQL type, queries, mutations.
    *   [ ] Implement resolvers/logic (`lib/activities/activities.ts`).
    *   [ ] Implement frontend UI (List, Create/Edit Form).
    *   [ ] Link Activities to Deals/Organizations/Contacts.
3.  **Asynchronous Workflows (Inngest Introduction):**
    *   [ ] Configure Inngest client and Netlify handler function (`functions/inngest`).
    *   [ ] Define first Inngest event (e.g., `crm/deal.created`).
    *   [ ] Publish event from GraphQL mutation resolver (e.g., after creating a Deal).
    *   [ ] Implement a simple Inngest function to handle the event (e.g., log deal creation).
    *   [ ] Set up Inngest keys in local `.env` and Netlify prod env vars.
4.  **Testing:**
    *   [ ] Add tests for Deal/Activity logic and GraphQL endpoints.
    *   [ ] Add tests for Deal pipeline UI interactions.
    *   [ ] Add basic test for Inngest event publishing/handling.

**Technical Tasks:**
*   [ ] Evaluate and select a drag-and-drop library for the Deal pipeline.
*   [ ] Refine GraphQL schema for potentially complex filtering/sorting of deals/activities.
*   [ ] Define Inngest event schemas.

## Phase 4: Refinement, Security Hardening & Monitoring (Ongoing / Dedicated Sprints)

**Goal:** Improve UX, implement security best practices, set up monitoring, and address architectural risks.

**Key Milestones:**
*   GraphQL security measures implemented (Depth/Complexity limits).
*   Basic monitoring/observability dashboard set up.
*   Key architectural risks mitigated or actively monitored.
*   Improved UI/UX based on initial feedback.

**Epics/Features:**

1.  **GraphQL Security Hardening:**
    *   [ ] Implement query depth limiting in Apollo Server.
    *   [ ] Implement query complexity analysis (e.g., `graphql-query-complexity`).
    *   [ ] *Research:* Evaluate APQ / Operation Whitelisting for production.
2.  **Monitoring & Observability Setup:**
    *   [ ] Implement structured logging in GraphQL Gateway/Inngest functions.
    *   [ ] *Research:* Set up basic tracing (OpenTelemetry) for Netlify functions.
    *   [ ] *Research:* Configure an error tracking service (e.g., Sentry).
    *   [ ] Monitor GraphQL Gateway cold start times (p95 latency). Set up alert if exceeding threshold (e.g., >500ms).
3.  **Architectural Risk Mitigation:**
    *   [ ] **Inngest Evaluation:** Define criteria for evaluating Inngest alternatives (cost, features, lock-in). Schedule review point (e.g., end of Phase 3).
    *   [ ] **Compliance Workflows:** Design and implement GDPR data erasure workflow (likely using Inngest triggered by user deletion).
4.  **UI/UX Refinements:**
    *   [ ] Implement global search functionality.
    *   [ ] Refine forms, validation feedback, loading/error states.
    *   [ ] Improve navigation and layout based on usage.
5.  **Testing Enhancements:**
    *   [ ] Implement E2E tests (Playwright/Cypress) for critical user flows (Login, Create Deal).
    *   [ ] Increase test coverage based on metrics.

## Future Phases (Post MVP)

*   **Reporting & Dashboards:** Basic CRM analytics.
*   **Custom Fields:** Allow users to add custom fields to entities.
*   **Team Features:** User roles, permissions, data sharing.
*   **Integrations:** (e.g., Email sync, Calendar sync)
*   **Advanced Search & Filtering.**
*   **New Domains:** Accounting, Logistics (leveraging microservice/DDD structure).
*   **AI Features:** (Leveraging GraphQL context, potential MCP/A2A integration via Inngest).

--- 