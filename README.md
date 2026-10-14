# Wasl | وصل

### A clearer connection between customers and support teams.

A bilingual customer-support operations platform with a **React customer portal**, an **Angular support workspace**, and one shared **Supabase** backend. Built for the complete request lifecycle, not just a collection of screens.

**React 19 · Angular 21 · TypeScript · Supabase Auth · PostgreSQL · Private Storage**

![Customer portal](docs/screenshots/customer-desktop.png)

## Delivery status

The application source, production builds, database migration, configuration examples, test tooling, and documentation are included. Both milestones are implemented.

**Update 1.1:** both applications now use project `vbsrwnjyiskbjangbohb`, with persistent light/dark appearance and a single-project Vercel deployment. The owner reports that the database setup is already complete. **Do not rerun the initial SQL setup on this configured project.**

The new public Auth endpoint responds successfully, and anonymous requests to `requests` and `profiles` are denied. Authenticated hosted workflows have not been independently tested without the owner's test-user credentials. No admin key or password is included.

An explicitly labeled browser-local demo is available for exploring both interfaces before backend setup. It is not a security boundary, does not contain real customer information, and never substitutes for a failed live request.

## What is included

### Customer portal

- Sign in, sign out, and customer registration with email confirmation.
- Create a support request with a category and urgency.
- Search and follow the customer's own requests.
- View request progress, public conversation, attachments, and resolution.
- Reply while a request is active; reopen a resolved request to continue.
- English and Arabic interfaces with persistent language preference and RTL support.
- Light/dark toggle on sign-in and application screens, saved across reloads and synchronized across same-origin tabs.

### Support workspace

- Search, category/status/urgency filters, ownership queues, sorting, and server-side pagination.
- Claim unassigned work, send public replies, and add private internal notes.
- Set progress, adjust urgency, and resolve assigned requests with a written resolution.
- Manager-only reassignment and server-aggregated workload reporting.
- The same request lifecycle and business vocabulary as the customer portal.

### Shared foundation

- One user model and one database for both applications.
- Row-level security, private file access, and server-side role/ownership checks.
- Transactional mutations with version checks and row locks.
- Canonical data refresh after changes; message drafts survive rejected updates.
- Visible loading, empty, validation, success, and failure states.
- Local font files, keyboard focus styles, semantic controls, and reduced-motion support.

## Quick start

### Requirements

- Node.js **20.19+** or **22.12+**; Node 22 LTS is recommended.
- npm 10+.
- A Supabase project you administer.
- Git, if you want to preserve and publish the included commit history.

```bash
npm ci
npm run build
npm run preview
```

Open:

| Application       | URL                               |
| ----------------- | --------------------------------- |
| Customer portal   | `http://localhost:4173/customer/` |
| Support workspace | `http://localhost:4173/support/`  |

Choose **Try as a customer**, **Try as an agent**, or **Try as a manager** to explore the demo. For cross-application demo workflows, use these same-origin preview URLs: browser-local demo data is not shared between development ports.

The downloadable delivery archive also includes prebuilt assets. In its source folder, `node scripts/serve.mjs` starts the included production preview without installing dependencies. The Git repository intentionally does not track generated builds; a clone requires `npm ci && npm run build` first.

### Development servers

```bash
npm run dev
```

- React: `http://localhost:5173/customer/`
- Angular: `http://localhost:4200/support/`

Both use the same Supabase project. Authentication storage is origin-scoped, so sign in separately on each development port. Use separate browser profiles for customer/agent/manager live demonstrations.

## Deploy to Vercel

Import the repository root using **Other** as the framework. `vercel.json` uses `npm run build:vercel` and publishes `site/`, containing `/customer/` and `/support/`. Add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` to Vercel Production/Preview environment settings using the supplied public values, then deploy. Update Supabase Site URL and Redirect URLs to your actual HTTPS application paths.

See [the Vercel guide](docs/VERCEL.md) for exact values and settings. No backend schema reset is needed.

## Set up Supabase

The supplied project configuration is already in `packages/shared/src/config.ts`:

```text
https://vbsrwnjyiskbjangbohb.supabase.co
```

For a **new, unconfigured database only**:

1. Open your Supabase project's **SQL Editor**.
2. On a fresh application schema, run the entire contents of **`supabase/setup.sql` once**.
3. In **Authentication → URL Configuration**, set the Site URL to your customer portal URL. Add development/production portal URLs as allowed redirects.
4. Keep email confirmation enabled for public registration. Configure SMTP before inviting real users.
5. Create the test accounts described below.
6. Sign in normally rather than using the demo buttons.
7. Run the live test suite before accepting the hosted integration.

`setup.sql` is an exact copy of the versioned migration. It creates enum types, tables, indexes, policies, transactional RPCs, the private storage bucket, and an Auth profile trigger. Existing Auth users are backfilled as customers; roles in user-editable metadata are ignored.

**Do not run it repeatedly or against an existing conflicting application schema.** It is a versioned initial migration, not a destructive reset script. Back up existing data first. See [backend setup](docs/BACKEND.md) for roles, manual test accounts, Storage, and the optional CLI path.

### Test accounts

| Email                      | Role            | Application                 |
| -------------------------- | --------------- | --------------------------- |
| `customer@wasl.test`       | Customer        | React                       |
| `other.customer@wasl.test` | Customer        | React; isolation tests      |
| `agent@wasl.test`          | Support agent   | Angular                     |
| `agent.two@wasl.test`      | Support agent   | Angular; reassignment tests |
| `manager@wasl.test`        | Support manager | Angular                     |

No shared password is committed. Choose your own test password of at least 12 characters.

You can create accounts through **Authentication → Users → Add user**, enable confirmation, and assign staff roles in SQL as documented in [BACKEND.md](docs/BACKEND.md). Alternatively:

```bash
cp .env.seed.example .env.seed
```

Set your project service-role/secret admin key and `TEST_USER_PASSWORD` **locally only**, then run:

```bash
npm run users:seed
```

The seed command creates or updates the five test accounts and assigns roles. Existing test-account passwords are reset to your supplied password. Do not run it against production employees. Delete `.env.seed` after use or store it securely outside the repository.

### Public configuration

The URL and publishable key are public application configuration, not privileged credentials. They are safe in browser code only because database and Storage permissions are enforced independently.

To use another hosted project:

```bash
cp .env.example .env
npm run config
npm run build
```

Edit `.env` before `npm run config`. Root build/dev commands also refresh configuration automatically. Vercel environment values take precedence and must contain both fields. The configuration generator accepts only an HTTPS URL and an `sb_publishable_` key. Never place an admin key in a frontend configuration file.

## Roles and lifecycle

| Capability                  | Customer              | Agent                      | Manager                  |
| --------------------------- | --------------------- | -------------------------- | ------------------------ |
| Read requests               | Own only              | All                        | All                      |
| Create a request            | Yes                   | No                         | No                       |
| Claim an unassigned request | No                    | Yes                        | Yes                      |
| Public reply or attachment  | Own active requests   | Assigned active requests   | Any active request       |
| Internal note or attachment | Never                 | Assigned active requests   | Any active request       |
| Read internal notes         | Never                 | Yes                        | Yes                      |
| Change progress or urgency  | No                    | Assigned active requests   | Assigned active requests |
| Resolve                     | No                    | Assigned requests          | Any assigned request     |
| Reopen                      | Own resolved requests | Assigned resolved requests | Any resolved request     |
| Reassign                    | No                    | No                         | Yes                      |
| Workload report             | No                    | No                         | Yes                      |

```text
New → In progress ⇄ Waiting for customer → Resolved
          ↑                                    │
          └──────────── Reopen ────────────────┘
```

A customer reply to a waiting request returns it to `in_progress`. Resolving requires an owner and a resolution of at least 10 characters. Resolved requests reject ordinary messages and uploads. A manager can reassign a resolved request without reopening it.

## Attachments

- PDF, PNG, and JPEG only; maximum **5 MiB per file** and **50 attachments per request**.
- Client-side size, filename, MIME, and signature validation.
- Storage bucket enforces allowed MIME types and size independently.
- A reservation, protected upload, and finalization workflow verifies uploaded metadata.
- Private/internal visibility is enforced for both attachment records and direct Storage access.
- Downloads use the authenticated Storage endpoint and a local download link; there are no public file URLs.
- Attachments are disabled in demo mode. Use the connected workspace to verify file operations.

## Testing

```bash
npm test
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
npm run format:check
npm audit
```

| Layer                      | Coverage                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| PostgreSQL migration tests | Actual RLS/RPC SQL executed in PGlite with minimal Auth and Storage schema fixtures                                                         |
| Shared unit tests          | Validation, translations, permission helpers, demo isolation, and stale mutations                                                           |
| Playwright                 | Cross-app workflow, private notes, URL guards, search/pagination, failure recovery, Arabic/mobile, keyboard dialog, automated accessibility |
| Live hosted tests          | Real Supabase Auth, RLS, Storage upload/download, isolation, ownership, manager aggregation                                                 |

The embedded tests exercise real PostgreSQL policies, **not** the deployed Supabase HTTP/Auth/Storage services. Browser tests use demo data and are not evidence of hosted security. The independent live suite covers those integration boundaries:

```bash
cp .env.live.example .env.live
npm run test:live
```

Set `TEST_USER_PASSWORD` in `.env.live` first. The live suite needs only the publishable key and test-user credentials, not an admin key. It creates a verification request and two small files, completes the request, and retains the evidence. Run it on a test project, not a production tenant.

See [verification notes](docs/VERIFICATION.md) for the recorded results and unverified boundaries.

## Repository layout

```text
apps/
  customer/                 React + Vite customer portal
  support/                  Angular standalone components and guarded routes
packages/shared/src/
  auth.ts                   Framework-independent authentication controller
  api.ts                    Shared Supabase data access and file workflow
  types.ts                  Roles, lifecycle, model types, validation
  i18n.ts                   English and Arabic application copy
  demo.ts                   Explicit browser-only sample environment
  styles.css                Shared interface primitives
  tokens.css                Semantic light/dark color palettes
  theme.ts                  Persistent cross-application theme preferences
supabase/
  setup.sql                 SQL Editor entry point
  migrations/               Versioned backend schema
scripts/                    Configuration, accounts, preview, live verification
tests/                     Database, unit, and browser suites
docs/                      Architecture, setup, review, deployment, GitHub guide
```

## Review and delivery guides

- [Architecture and security](docs/ARCHITECTURE.md)
- [Backend setup](docs/BACKEND.md)
- [Demonstration walkthrough](docs/DEMO.md)
- [Requirement traceability](docs/REQUIREMENTS.md)
- [Design decisions](docs/DESIGN.md)
- [Vercel deployment](docs/VERCEL.md)
- [Deployment](docs/DEPLOYMENT.md)
- [GitHub publishing and commit history](docs/GITHUB.md)
- [Arabic handoff](docs/HANDOFF-AR.md)

## Operational limits

- Updates are polled every 15 seconds while the page is visible; this is not realtime push.
- Request lists use indexed search and offset pagination, 12 rows at a time. Deep-page offsets and exact counts should be revisited for very large datasets.
- Conversations load the latest 40 messages and allow earlier pages; the hosted PostgREST row cap currently limits a single expanded conversation to 1,000 messages. Activity shows the latest 40 events. The complete history remains in the database.
- The staff picker supports up to 1,000 employees; larger organizations need a paginated directory picker.
- Upload failures attempt cleanup. A browser crash can leave an unfinished reservation/object requiring administrator cleanup.
- File signatures are checked in the browser, not trusted as server-side malware scanning. Add server-side content inspection/quarantine before accepting untrusted files at production scale.
- There are no offline writes, email notifications, password-reset UI, satisfaction ratings, saved filters, or request deletion. These are outside the required milestones.
- Supabase project limits, SMTP, backups, abuse controls, legal retention, monitoring, and production-domain configuration are the operator's responsibility.
- Automated accessibility checks cover representative workflows; they do not replace a full manual assistive-technology audit.

Authored source files contain no inline code comments. Architecture and implementation explanations live in the documentation. Third-party font licenses are retained under `assets/fonts/`.
