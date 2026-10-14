# Requirement traceability

| Requirement                                      | Implementation                                        | Verification                                    |
| ------------------------------------------------ | ----------------------------------------------------- | ----------------------------------------------- |
| Separate React/Angular experiences               | `apps/customer`, `apps/support`                       | Production build and browser workflow           |
| Shared sign-in/sign-out and roles                | Shared AuthController + Supabase Auth + profiles      | Guard tests; live Auth suite                    |
| Customer isolation despite direct URL/API access | Request RLS, visibility helper, scoped RPCs           | SQL and browser tests; live suite supplied      |
| Agent is not a manager                           | Database role check, manager route guard              | Direct SQL rejection and URL guard test         |
| Navigation and user identity                     | React header; Angular sidebar/topbar                  | Desktop/mobile browser tests                    |
| Loading/initialization states                    | Auth boundary, loaders, disabled pending controls     | Browser initialization test                     |
| Submit and follow requests                       | Customer form, list, detail, resolution               | Cross-app end-to-end test                       |
| Category, urgency, owner, status, reference      | Enums, constraints, indexed request model             | SQL constraints and unit validation             |
| Search/filter/sort/pagination                    | Shared server query builder and both lists            | Browser filtering and pagination test           |
| Claim available work safely                      | Row-locked claim RPC + required version               | Stale-claim SQL test                            |
| Customer-visible communication                   | Public messages and authenticated authors             | Complete workflow test                          |
| Internal notes never exposed                     | Independent message/activity RLS                      | Direct SQL visibility test; live suite supplied |
| Ownership-aware updates                          | Claim, assign, status and resolution RPC              | Former-owner rejection test                     |
| Reopen resolved requests                         | Lifecycle RPC and guarded composer                    | SQL and browser workflow                        |
| No normal communication while resolved           | RPC/file reservation state checks                     | SQL and browser tests                           |
| File handling and private access                 | Reserved private paths, finalization, Storage RLS     | SQL policies; real Storage suite supplied       |
| Failed updates remain truthful                   | Pessimistic changes, preserved drafts, error feedback | Browser conflict test                           |
| Current information without duplicates           | 15-second replace-based polling, request generations  | Conflict and workflow tests                     |
| Manager workload without full dataset            | Server-side SQL aggregate RPC                         | SQL and browser report checks                   |
| English/Arabic and small screens                 | Shared translation dictionary, RTL CSS                | Browser mobile/Arabic test                      |
| Accessibility                                    | Semantic controls, labels, focus, reduced motion      | Axe AA list audit and dialog keyboard test      |
| Safe configuration                               | Public-key config; ignored private environment files  | Repository review and config guard              |
| Runnable backend/data setup                      | SQL Editor setup and optional CLI migration           | Migration executed in embedded PostgreSQL       |
| Test users                                       | Dashboard instructions and admin-only seed tool       | Live suite consumes documented accounts         |
| Meaningful history                               | Incremental implementation/test/documentation commits | Bundled Git history                             |
| Assumptions and limitations                      | README and architecture documentation                 | Delivery review                                 |

The host-owner setup and real hosted integration verification are explicitly pending. They are not marked complete merely because demo workflows pass.
