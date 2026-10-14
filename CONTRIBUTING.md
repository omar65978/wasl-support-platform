# Contributing

Thank you for helping improve Wasl. Keep changes focused, reproducible, and consistent across the React customer portal, Angular support workspace, and shared backend contracts.

## Development setup

Use Node.js 22.x and npm 10 or later. Follow the [README](README.md) to install and run the combined preview, or use `npm run dev` for the individual development servers.

External contributors should fork the repository, create a descriptive branch, and open a pull request. Maintainers should follow the repository's configured branch protections and review process.

## Before submitting

```bash
npm ci
npm run format
npm run format:check
npm run verify
npm run build:vercel
npx playwright install --with-deps chromium
npm run test:e2e
```

For documentation-only changes, at minimum check formatting, Markdown rendering, and local links. CI still runs the configured full workflow.

A pull request should describe:

- The problem and the intended behavior.
- The affected applications or shared modules.
- Checks actually performed and any checks not performed.
- Screenshots for meaningful UI changes, using sample data rather than customer information.
- Any configuration or migration requirements.

## Project conventions

- Keep source code clear and self-descriptive; put architectural explanations in documentation rather than inline comments.
- Add corresponding English and Arabic translations for visible interface copy.
- Preserve RTL layout, keyboard behavior, responsive screens, reduced motion, and both color themes.
- Keep authorization enforced by the backend. UI guards are not security boundaries.
- Keep database setup and migration sources consistent. Never rerun initial setup against an already initialized deployment as an update strategy.
- Use focused commits that accurately describe the work. State verification limits honestly.

## Sensitive information

Do not commit admin keys, passwords, private environment files, real recovery links, or private user data. Use `.env.example` files as templates. Never put sensitive security reports or customer data into a public issue or pull request; arrange a private reporting channel with the maintainer first.

Do not run hosted integration tests against someone else's project or a sensitive production dataset. Recovery browser tests use mocked Auth endpoints and are not evidence of live email delivery.

## Licensing

The repository does not currently assign a project-wide open-source license. Public visibility is not a blanket reuse grant. Preserve the included third-party licenses and discuss licensing expectations with the maintainer before contributing code from another source.
