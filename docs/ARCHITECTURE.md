# Architecture and security model

## Boundaries

```text
React customer portal ──┐
                        ├── Shared TypeScript repository ── Supabase Auth
Angular support app ────┘                              ├── PostgreSQL + RLS + RPCs
                                                     └── Private Storage
```

Both frontends use the same roles, TypeScript models, translations, lifecycle rules, and repository implementation. The demo repository is explicitly separate and must never be treated as an authorization implementation.

## Authentication state

`packages/shared/src/auth.ts` owns initialization, session changes, sign-in, profile resolution, and sign-out. `profiles.role` is the authoritative role, not user-editable Auth metadata.

React reads the controller with `useSyncExternalStore`. Angular mirrors its snapshots into an injectable signal-based `AppState`. Both show a loading boundary while initializing. Angular route guards and the React authenticated shell prevent ordinary navigation into the wrong experience. Backend authorization is independently enforced even if all frontend code is bypassed.

Supabase manages signed sessions and token refresh. Browser session persistence uses origin-scoped storage. On a shared origin, sign-in/sign-out events propagate through the underlying Auth client. Use separate browser profiles for simultaneous real users. Demo sessions are per application and per tab, separate from live Auth.

Role changes already made in the database take effect at the authorization boundary immediately. An already-open UI may show its previous role until a reload; a stale interface cannot grant additional server privileges.

## Authorization layers

1. Table `SELECT` policies apply customer isolation and internal visibility.
2. Authenticated users have no direct INSERT/UPDATE/DELETE grant on business tables.
3. Mutations use narrowly scoped `SECURITY DEFINER` functions with an empty search path and fully qualified objects.
4. Every function checks the authenticated database role model, request visibility, lifecycle state, and ownership as applicable.
5. Row locks serialize conflicting mutations. Required version arguments detect stale clients rather than silently overwriting another person's changes.
6. Storage policies use reserved object paths and enforce the same request/internal visibility rules.
7. Manager reporting validates the manager role on the server before aggregation.

The profile bootstrap trigger always assigns `customer`. Setting `role=manager` in signup metadata is ignored. A customer cannot promote themselves, write a request for another customer, query another customer's messages, or download another customer's files.

Support employees can read all support requests and internal notes to coordinate work. Only an assigned agent or a manager can mutate a request. Managers can reassign; agents cannot. This distinction is tested through direct SQL and in the provided live HTTP tests.

## Shared business model

- `profiles`: Auth user ID, display name, role, creation time. No email/password/token fields.
- `requests`: customer/owner, stable reference, content, category, urgency, state, resolution, version, timestamps, search vector.
- `messages`: immutable conversation entries with author and a server-enforced internal flag.
- `activities`: append-only business events, without copying private note bodies into public activity.
- `attachments`: private object reservation and finalization metadata, including visibility and uploader.

Foreign keys, constraints, enums, unique references, and RPC validation protect the model independently of form validation. Admin-level operations remain available only through trusted database/admin credentials.

## Request lifecycle and ownership assumptions

- Public registration creates customers; staff accounts are administrator-managed.
- Every profile has exactly one role; there are no multiple-company organizations in this milestone.
- Customers create requests. Agents/managers do not impersonate customers to create requests.
- Any support employee may claim an unassigned new request.
- Managers may assign/reassign to an agent or manager. Assigning a new request moves it to investigation.
- A request must have an owner before it can wait or be resolved.
- Agents manage only requests assigned to them. Managers can manage any assigned request.
- Unassigned work must be claimed or assigned before replying through the support UI.
- Customers may reply/upload on their own non-resolved requests, including new requests.
- A public customer reply to a waiting request resumes investigation.
- Resolution requires meaningful text. Normal communication stops while resolved.
- Customers may reopen their own requests. The previous owner is retained and the prior resolution is cleared; the resolution event remains in activity.
- A resolved request may be reassigned by a manager without changing its state.

## Server data and failed actions

`api.ts` is the only live business-data access module. Queries are made against RLS-protected tables or RPCs. Components manage loading/error/data snapshots; they do not invent a successful server mutation.

Mutations are pessimistic: buttons show progress and are disabled to prevent double submission. Success notifications appear only after the backend accepts the mutation. Data is then fetched again. Failed messages retain their draft. A version conflict refreshes the canonical record and asks the user to review/retry.

Mutations are not automatically retried. If the network drops after the server commits but before its response arrives, the client cannot know the result immediately. Refresh and inspect the conversation before manually retrying. Version checks prevent a stale retry from immediately repeating a versioned operation. Create operations do not yet have an idempotency token.

## Current data and reconciliation

Visible pages poll at 15-second intervals; React also refreshes on focus. Background tabs do not poll. Angular cancels component timers on navigation; React cleans up effect timers. Request-generation counters discard older, out-of-order responses. Responses replace canonical snapshots rather than append duplicate messages. A component unmount/navigation prevents late responses from updating the next screen.

There is no promise of instant notification. A successful local action triggers an immediate refresh; another user's action normally appears within the next polling interval.

## Growing data

- Requests use 12-row server pages, deterministic ordering, and exact matching counts.
- Search uses a generated PostgreSQL `tsvector` and a GIN index with `simple` tokenization, suitable for exact-word English and Arabic matching without language stemming.
- Status, owner, customer, and urgency/order indexes support common queues.
- Search inputs are debounced and passed as structured query values rather than interpolated SQL.
- Managers receive aggregated JSON, not every request row.
- Messages begin with 40 entries. Loading earlier history expands that window on explicit interaction; the current PostgREST cap is documented.
- Activity shows the latest 40 events; attachments are capped at 50 per request.

Most performance-sensitive screens are the shared request list with exact count/search, repeated detail reads for long conversations, and workload aggregation on very large tables. At substantially larger scale, introduce keyset pagination, paginated message cursors, cached counters/materialized summaries, and measured indexes without changing permission behavior.

## Browser-safe information

Safe to expose: project URL, publishable key, display names, roles required for authorized UI, and records returned by RLS. Staff names and role identifiers are visible to authenticated customers for identity attribution; staff emails and credentials are not stored in the public profile model.

Never expose: database passwords, Supabase admin/secret/service-role keys, access tokens from other users, internal notes in customer payloads, public links to protected attachments, or unrestricted admin clients.

The frontend necessarily holds the current user's session token. Avoid untrusted scripts, keep dependencies updated, serve over HTTPS, and deploy a suitable CSP. No HTML from request content is interpreted; frameworks render it as text. Downloaded files are still untrusted content and need production threat-model review.

## Test confidence

The migration tests are the most important authorization tests because they execute actual PostgreSQL grants, policies, and functions. They use fixture Auth/Storage schemas and therefore do not replace hosted service tests. Playwright demonstrates product behavior and reconciliation; the hosted suite validates API serialization, real Storage operations, and actual project configuration.
