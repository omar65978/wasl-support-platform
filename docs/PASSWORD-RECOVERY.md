# Password recovery

Both applications provide a **Forgot password?** action and a password-reset screen in English and Arabic. Recovery works independently of `public.profiles`: a missing application profile does not prevent changing the Auth password, but that profile must still be restored before the user can use the application.

## Owner setup

No database migration, table recreation, administrative frontend key, or new Vercel environment variable is required.

In Supabase **Authentication → URL Configuration**, retain the existing application URLs and add these exact recovery URLs to **Redirect URLs**:

```text
https://wasl-support-platform-v2.vercel.app/customer/?auth=recovery
https://wasl-support-platform-v2.vercel.app/support/?auth=recovery
```

Keep the production Site URL as:

```text
https://wasl-support-platform-v2.vercel.app/customer/
```

For combined local preview, also allow these URLs if you need to test real recovery locally:

```text
http://localhost:4173/customer/?auth=recovery
http://localhost:4173/support/?auth=recovery
```

Development servers use ports 5173 and 4200 respectively. Add only the exact development or Preview domains you actually need; do not allow arbitrary third-party deployment domains. Requests calculate the callback from the current origin and the application that requested recovery.

The implementation supports Supabase's default implicit recovery callback, containing a recovery session in the URL fragment. The default **Reset Password** email template should keep its link to `{{ .ConfirmationURL }}` so Supabase verifies the email token before redirecting to the application. A customized template that links directly to `{{ .SiteURL }}` or `{{ .RedirectTo }}` without verification will not establish a recovery session. Templates using a custom token-hash or PKCE flow require a separate implementation and are not supported by this screen.

Use a correctly configured mail provider for real users. Default email-service restrictions, rate limits, spam filtering, delivery failures, or a disabled provider are not fixed by a frontend deployment. Review Auth logs and email-provider logs if a message does not arrive. Never share recovery links, access tokens, refresh tokens, or account passwords.

## User flow

1. Open either sign-in screen and select **Forgot password?**.
2. Enter the account's email address.
3. The screen gives a neutral acknowledgement that does not confirm whether the account exists. A send error or rate limit remains an error, not a success notification.
4. Open the most recent recovery email and follow its link.
5. Enter and confirm a password of at least 12 characters. Supabase may enforce additional security requirements.
6. After saving, use **Back to sign in**. The app requests global sign-out and then returns to the originating application's sign-in page.
7. Sign in with the new password. Existing access JWTs in other clients may remain valid until expiry even after global sign-out; do not treat session revocation as instantaneous JWT invalidation.

The reset form also supports dark mode and RTL layout. It does not offer demo-role entry during recovery.

## Invalid links and refreshes

Recovery credentials are captured before the hash routers start, removed from the visible address, and passed to Supabase Auth for session validation. The client does not trust the query flag alone and does not substitute an existing session when a recovery link is missing or invalid.

The callback is consumed in memory. Reloading the reset page after its fragment has been removed intentionally shows the new-link screen; request a fresh link instead of replaying the cleaned URL. Expired or rejected sessions also lead to the new-link screen. A temporary validation failure may require another link.

If password saving succeeds but sign-out fails, the completion screen stays visible with an actionable error. Retry **Back to sign in** rather than saving the same password again.

## Missing profiles

`auth.users` holds the login account; `public.profiles` holds application identity and role. Deleting a profile does not delete the Auth user or reset its password. Re-registering an existing email does not reliably create a new profile or resend confirmation.

An administrator can restore the missing profile using the existing Auth user's exact ID, the correct name, and the user's previously authorized role. This update does not automatically create profiles, modify roles, or grant staff privileges. Sign-in now reports a missing profile explicitly rather than presenting a generic error.

## Verification

The update was checked on Node.js 22.23.3:

- `npm test`: 52 tests passed, including 18 new recovery and demo-copy tests.
- `npm run test:e2e`: 29 Chromium tests passed, including 13 new recovery, missing-profile, bilingual demo-copy, mobile, and representative accessibility tests.
- `npm run build:vercel`: both applications built and the combined static output was generated.

New browser tests intercept Auth requests with synthetic sessions and fake passwords. They exercise the actual browser clients and interfaces without sending email or changing a hosted account. They do **not** verify hosted email delivery, project redirect settings, live Auth policies, or real password changes. The owner must perform the live flow after deployment.

Screenshots use synthetic test data:

- [Customer recovery, Arabic mobile](screenshots/customer-password-recovery-arabic.png)
- [Support recovery, Arabic mobile](screenshots/support-password-recovery-arabic.png)

## Demo notice

The shared translations used by both applications are:

**English**

> Demo workspace. Sample data stays in this browser; nothing is sent to the database.

**Arabic**

> مساحة تجريبية. تُحفظ البيانات في هذا المتصفح فقط ولا تُرسل إلى قاعدة البيانات.
