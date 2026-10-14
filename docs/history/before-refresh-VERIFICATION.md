# Verification record

Verified on **14 October 2026**, using Node.js 20.20.2 and npm 10.8.2 in the delivery environment. Node 22 LTS is the recommended deployment runtime.

## Release 1.1 update

The owner reports that the new hosted schema is already configured. This delivery changed no hosted tables. The supplied URL/public key were embedded in the shared source and examples. Auth settings returned HTTP 200; anonymous reads of `requests` and `profiles` returned HTTP 401 / PostgreSQL permission-denied code 42501. This is not a substitute for authenticated live workflow testing.

Eight additional unit tests cover theme resolution, public-key validation, cloud environment precedence, missing-variable errors, and Vercel configuration. Five additional browser tests cover cross-app/cross-tab persistence, pre-bundle theme initialization, system preference changes, draft preservation, Arabic mobile use, and dark-mode accessibility across eight representative screens. Total: 34 SQL/unit/configuration tests and 16 browser tests.

The production build and Vercel static-output generation pass locally. Actual hosted Vercel deployment has not been performed because no account connection is available.

## Completed checks

| Check                                                   | Result                                                                                              |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| TypeScript strict checks, including unused declarations | Passed                                                                                              |
| React/Vite production build                             | Passed                                                                                              |
| Angular production build and strict templates           | Passed                                                                                              |
| PostgreSQL migration/policy tests                       | 17 passed                                                                                           |
| Shared model/validation tests                           | 9 passed                                                                                            |
| Chromium end-to-end tests                               | 11 passed                                                                                           |
| Total automated test cases                              | **50 passed**                                                                                       |
| Representative automated WCAG A/AA checks               | No detected violations in tested customer login, customer list/detail, support list, manager report |
| Arabic and RTL at 390 px                                | Passed, no document-level horizontal overflow in tested lists                                       |
| Mobile navigation focus trap and Escape dismissal       | Passed                                                                                              |
| Prettier formatting check                               | Passed                                                                                              |
| Full npm dependency audit                               | 0 known vulnerabilities at verification time                                                        |
| Both development servers                                | Started successfully; both demo entry flows rendered without browser runtime errors                 |
| Supabase public Auth settings endpoint                  | HTTP 200 using the supplied publishable key                                                         |
| Source SQL and SQL Editor setup parity                  | Identical                                                                                           |

The SQL tests execute the **actual delivered migration**, with minimal fixture `auth` and `storage` schemas. They verify customer isolation, anonymous denial, role-escalation prevention, internal-note visibility, stale and null version rejection, ownership transfer, resolution/reopening, direct file policies, invalid metadata, and server aggregates.

Browser tests cover the complete create/claim/public reply/internal note/customer reply/resolve/reopen/reassign workflow, customer URL isolation, agent manager-route denial, search/filter/pagination, draft preservation after a rejected mutation, initialization, responsive Arabic layouts, and keyboard behavior.

## Fixes found during verification

- Qualified outer Storage object names in policies to avoid accidental binding to attachment metadata names.
- Rechecked ownership and state during attachment finalization.
- Rejected null mutation versions instead of allowing a missing version to bypass conflict detection.
- Disabled Angular critical-CSS inlining to keep stylesheet loading compatible with the delivered CSP.
- Excluded the linked shared TypeScript workspace from Angular development dependency prebundling.
- Waited for authentication initialization before evaluating manager route access.
- Increased muted text contrast and small-screen request readability.
- Removed closed mobile navigation from keyboard access and added focus trapping/Escape handling when open.

## Not verified on the hosted project

The delivery had no privileged project connection, database password, or administrative token. Therefore:

- The owner reports the hosted SQL migration is applied; this assistant did not apply or alter it.
- Account setup is owner-managed; this delivery has no test-user passwords to verify it independently.
- Hosted RLS, HTTP RPC serialization, Storage uploads/downloads, and live email confirmation have **not** been executed end to end.
- `npm run test:live` is supplied but was **not run**.
- SMTP configuration, backups, deployed HTTPS domains, infrastructure limits, and production monitoring remain owner tasks.
- Docker and GitHub Actions definitions are supplied but were not executed in those hosting environments.

A public Auth endpoint returning HTTP 200 validates the project URL/public key, not the existence of application tables or successful live workflows.

## Acceptance after owner setup

1. Keep the existing configured schema; do not rerun the initial SQL migration.
2. Confirm the existing test accounts and roles.
3. Configure authentication URLs and email delivery.
4. Fill in `.env.live` locally and run `npm run test:live`.
5. Demonstrate the real customer/agent/manager flow in separate browser contexts.
6. Verify public and internal attachments with actual Storage.
7. Review the operational limits in README before a production launch.

Screenshots are captured from the explicitly labeled local demo, not from real customer data. Automated accessibility tests are evidence for the tested pages only, not a full accessibility certification.

## Password recovery and demo-copy update — 2026-10-14

The update based on commit `ea7d25df9f9a748fcd0bae78dff98d8e8ec3cb68` passed 52 SQL/unit/configuration tests and all 29 Chromium browser tests on Node.js 22.23.3. The combined Vercel build passed. This supersedes the earlier 34/16 test counts for the updated source.

New coverage includes callback credential removal before hash routing; rejection of missing, wrong-type, and expired recovery links; recovery independent of missing profiles and demo sessions; neutral reset-request confirmation; rate limits; minimum password length and confirmation; a successful password update and global sign-out request; and Arabic/mobile/dark-mode screens with representative automated accessibility checks. Both applications display the exact revised demo notice in English and Arabic.

Recovery browser tests mock the Supabase Auth endpoints with synthetic credentials. No actual reset emails were sent, no hosted passwords or profiles were changed, and no live deployment or dashboard settings were modified by this verification. Hosted delivery and end-to-end recovery with the owner’s real account remain owner verification steps. See [Password recovery](../PASSWORD-RECOVERY.md).
