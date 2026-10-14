# Verification record

This document separates reproducible automated checks from live production behavior. Test counts are a dated record, not a guarantee of complete coverage or a security/accessibility certification.

## Latest observed repository evidence

Reviewed on **14 October 2026**, at commit [`81e412e`](https://github.com/omar65978/wasl-support-platform/commit/81e412e85484b36a93888da0e33df84473ac8594).

The [Verify platform run for that commit](https://github.com/omar65978/wasl-support-platform/actions/runs/38615210243) completed successfully. The workflow uses Node.js 22 and checks:

- A clean dependency installation with `npm ci`.
- Prettier formatting.
- TypeScript checks and production builds for React and Angular.
- SQL, shared-logic, configuration, and recovery unit tests.
- Combined Vercel static-output generation.
- Chromium browser workflows and representative automated accessibility checks.
- Production dependency audit at the high-severity threshold.

This is a snapshot of an observed run. Use the README badge and Actions page for the result of later commits. A documentation-only review is not a fresh execution of all application tests.

## Latest recorded local application verification

The password-recovery update was tested on Node.js **22.23.3** before publication. The recorded results were:

| Check                                 | Result        |
| ------------------------------------- | ------------- |
| SQL authorization and lifecycle tests | 17 passed     |
| Shared model and validation tests     | 9 passed      |
| Theme and configuration tests         | 8 passed      |
| Recovery and demo-copy unit tests     | 18 passed     |
| SQL/unit/configuration total          | **52 passed** |
| Chromium browser tests                | **29 passed** |
| Combined automated cases              | **81 passed** |
| React and Angular production builds   | Passed        |
| Vercel static staging                 | Passed        |
| Prettier formatting                   | Passed        |

The 29 browser tests include the earlier 16 workflow/theme tests and 13 recovery, missing-profile, localization, and demo-copy tests. Counts should be updated when tests are added or removed.

## What these checks establish

The SQL tests execute the repository migration in PGlite with minimal fixture Auth and Storage schemas. They check isolation, role boundaries, internal-note visibility, lifecycle rules, stale update handling, ownership transfer, and attachment policies in that test environment.

The browser tests cover the application clients and representative request, theme, language, mobile, and keyboard flows. Recovery tests intercept Auth requests with synthetic credentials. They check missing/invalid links, neutral email-request acknowledgements, password confirmation, missing profiles, and recovery completion without changing a hosted account.

Screenshots are based on local sample data or synthetic recovery fixtures. Automated accessibility checks are limited to the tested pages and states.

## What remains separate

The following are not established by a passing mocked browser test or a public page returning HTTP 200:

- Actual delivery of confirmation and password-reset emails.
- Live password changes and subsequent sign-in for a real hosted account.
- End-to-end production RLS, RPC serialization, and Storage behavior.
- SMTP configuration, backups, retention, abuse controls, or monitoring.
- Container runtime behavior; a Dockerfile alone is not a verified container deployment.

The existing record does not contain a completed `npm run test:live` result. The schema was reported as configured by the owner; the historical implementation/verification assistance did not apply or alter that hosted schema. See the preserved [earlier verification record](history/before-refresh-VERIFICATION.md) for that context.

## Reproduce the automated checks

```bash
npm ci
npm run format:check
npm run verify
npm run build:vercel
npx playwright install --with-deps chromium
npm run test:e2e
npm audit --omit=dev --audit-level=high
```

Use Node.js 22.x. Do not interpret a historical dependency audit as proof that no new advisories exist.

## Record live verification safely

Use a dedicated test project and the documented test accounts. Configure the ignored `.env.live` from its example, then run:

```bash
npm run test:live
```

This suite creates verification data and files. Do not run it against an unrelated or sensitive production dataset. Record the date, source commit, environment, steps, and pass/fail results without passwords, tokens, full recovery links, or private customer data.

Also test real password recovery from both application origins after configuring the exact redirects and mail template in [Password recovery](PASSWORD-RECOVERY.md). A missing `profiles` row must be restored separately before application access works.

## Historical records

Earlier counts and runtime notes are preserved under [Historical documentation](history/README.md). They describe their original verification stage and are not current totals. The historical content and contribution context are retained rather than silently removed or presented as proof of entirely manual authorship.
