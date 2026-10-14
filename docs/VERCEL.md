# Deploy both applications to Vercel

## Current project

The source and example configuration already target:

```text
https://vbsrwnjyiskbjangbohb.supabase.co
```

The project owner reports that database setup is complete. **Do not rerun `supabase/setup.sql` on the configured project.** This update changes frontend configuration and deployment assets, not database tables.

## One repository, one Vercel project

Import the root of this repository. Do not choose `apps/customer` or `apps/support` as the Root Directory, and do not deploy the applications as two unrelated projects.

The supplied `vercel.json` builds both applications into `site/`:

| Setting          | Value                  |
| ---------------- | ---------------------- |
| Framework Preset | Other                  |
| Root Directory   | Repository root (`.`)  |
| Install Command  | `npm ci`               |
| Build Command    | `npm run build:vercel` |
| Output Directory | `site`                 |
| Node.js          | 22.x recommended       |

The file already defines the install/build/output settings. If you previously created the Vercel project with different overrides, correct those overrides in Project Settings.

## Environment variables

Before deploying, add these two values in Vercel Project Settings → Environment Variables. Enable them for Production and Preview, and Development if you use the Vercel CLI:

```env
SUPABASE_URL=https://vbsrwnjyiskbjangbohb.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_PA3m399V0GAIkiCGa_1lhg_YCWHdIeS
```

These are public configuration. Do not add `service_role`, an `sb_secret_` key, database passwords, or test passwords to a frontend deployment.

Builds read environment variables before local files. Both values are required in Vercel; incomplete configuration fails the build instead of silently combining credentials from different projects. Local builds already work using the committed public defaults in `.env.example`.

After changing an environment variable, redeploy: these values are compiled into both applications.

## Publish

1. Publish the updated repository to GitHub.
2. In Vercel, select Add New → Project and import that repository.
3. Confirm the root/build settings above and add the two variables.
4. Deploy.
5. Use the stable production URL for your final Supabase configuration.

The applications will be available at:

```text
https://YOUR-PROJECT.vercel.app/customer/
https://YOUR-PROJECT.vercel.app/support/
```

The root redirects to `/customer/`. Both use hash routes, so refreshing a URL such as `/support/#/requests/REQUEST_ID` continues to load the correct application. Cross-application navigation is relative to the deployed origin; it does not call localhost in production.

## Supabase after the first deployment

In Authentication → URL Configuration, set Site URL to:

```text
https://YOUR-PROJECT.vercel.app/customer/
```

Add the production URLs to Redirect URLs:

```text
https://YOUR-PROJECT.vercel.app/customer/
https://YOUR-PROJECT.vercel.app/support/
```

Keep localhost entries only if local development is needed. For a custom domain, add that domain's paths and use its customer URL as Site URL.

Registration sends `emailRedirectTo` using the actual customer application origin. Therefore, add an exact Preview deployment URL if you intend to test email confirmation there. Avoid allowing every `*.vercel.app` deployment indiscriminately. The production domain does not exist until deployment, so it cannot be prefilled in Supabase by source code.

## Production smoke test

- Open both application URLs directly and refresh them.
- Sign in with existing real test accounts; do not use the demo buttons for integration testing.
- Check customer creation, agent claim/reply, private notes, customer response, manager reassignment, and protected attachments.
- Check light/dark switching, persistence on reload, and Arabic layouts.
- Run `npm run test:live` locally if you want the complete hosted API test. Its test password remains in ignored `.env.live`, not in Vercel.

## Troubleshooting

| Symptom                                   | Check                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| Build requests Supabase configuration     | Add both exact environment-variable names and redeploy                          |
| Shared workspace cannot be found          | Import the repository root, not an individual app folder                        |
| 404 on one application                    | Confirm Output Directory is `site` and use `/customer/` or `/support/`          |
| Old project receives requests             | Remove an old local `.env`, check Vercel environment values, and rebuild        |
| Old login stops working after this update | Sign in again; sessions are now namespaced to the new project                   |
| Confirmation goes to localhost            | Update Supabase Site URL/Redirect URLs and redeploy with current source         |
| Missing application tables                | Confirm the correct SQL was applied to the new project; do not blindly rerun it |
| Preview toolbar is blocked                | The deployment CSP intentionally does not allow third-party injected scripts    |

The Vercel build and generated static assets are validated locally. An actual hosted Vercel deployment still requires your account and repository connection.

## Password recovery redirects

Both applications now include password recovery. In addition to the base application URLs, allow the exact `?auth=recovery` callbacks for the deployed origin. For the current production domain:

```text
https://wasl-support-platform-v2.vercel.app/customer/?auth=recovery
https://wasl-support-platform-v2.vercel.app/support/?auth=recovery
```

Keep the Reset Password email template linked to `{{ .ConfirmationURL }}`. See [Password recovery](PASSWORD-RECOVERY.md) for the live checklist, mail troubleshooting, and callback behavior. Do not rerun database setup for this update.
