# Deployment

## Recommended layout

Host both applications on one HTTPS origin:

```text
https://support.example.com/customer/
https://support.example.com/support/
```

The builds already use these base paths. Hash-based routing removes the need for per-screen server rewrites. Supabase remains the shared managed backend; the static host never needs an admin credential.

## Node host

Use Node 22 LTS:

```bash
npm ci
npm run build
npm run preview
```

`PORT` defaults to 4173. The server binds to `0.0.0.0`, serves both builds, exposes `/health`, and redirects `/` to the customer portal. It does not serve source files or environment files. Deploy behind a reverse proxy with HTTPS, compression, request limits, and appropriate access logs.

The Node preview server is intentionally small. It is also usable as a static container entry point, but does not provide TLS, operational monitoring, or process supervision itself.

## Docker

```bash
docker build -t wasl-support .
docker run --rm -p 4173:4173 wasl-support
```

The runtime image contains only Node, the two compiled applications, and the static server. It runs as a non-root user. No database secret is needed at build or runtime. The Docker recipe is supplied; container execution was not verified in the delivery environment.

## Static hosting

Copy:

- `apps/customer/dist/*` into the site's `/customer/` directory.
- `apps/support/dist/browser/*` into the site's `/support/` directory.

Configure `/` to redirect to `/customer/`. Both apps include self-hosted font assets. Keep HTML uncached or use short revalidation; hashed JS/CSS/font files can have long immutable cache lifetimes.

Keep Angular's critical-CSS inlining disabled under a strict script CSP: its default asynchronous stylesheet loading uses an inline `onload` handler. The delivered build configuration avoids that handler.

## Security headers

The supplied server emits `nosniff`, a referrer policy, a limited permissions policy, and a CSP that permits the application origin and Supabase connections. Inline styles are allowed for framework styles and dynamic layout values; inline JavaScript is not.

For production, narrow `connect-src` to the exact Supabase project host and configure `frame-ancestors` for your embedding policy. The preview does not set an embedding restriction because the delivery viewer embeds it. Production environments should explicitly decide whether framing is allowed. Add HSTS at the HTTPS reverse proxy only after confirming your domain configuration.

## Supabase release checklist

- Apply migrations once and back up the current schema/data.
- Verify the correct public URL/key are compiled into both apps.
- Set Site URL and allowed redirects to production HTTPS locations.
- Configure transactional email delivery and confirmation.
- Replace/remove shared-password test accounts before launch.
- Confirm the bucket is private and no broad Storage policy was added by other applications.
- Run the live test suite against a staging project.
- Review upload threat handling, rate limits, retention, backups, and monitoring.
- Validate keyboard and assistive-technology workflows for your production content.

## GitHub Pages

GitHub Pages is not the default deployment target because project sites introduce an additional repository path and cannot provide the delivered server headers. A custom-domain static host or the Node/Docker setup is simpler. Publishing source to GitHub does not deploy Supabase or create Auth users automatically.
