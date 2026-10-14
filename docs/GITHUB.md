# Repository workflow

The active repository is [omar65978/wasl-support-platform](https://github.com/omar65978/wasl-support-platform). Its name does not need to match the production hostname, which remains `wasl-support-platform-v2.vercel.app`.

## Clone and run

```bash
git clone https://github.com/omar65978/wasl-support-platform.git
cd wasl-support-platform
npm ci
npm run build
npm run preview
```

Use Node.js 22.x and npm 10 or later. The application URLs are `/customer/` and `/support/` on `http://localhost:4173`.

A normal clone contains source and history, not compiled applications. Run the build before previewing. Do not run `git init` inside an existing clone or restore an older bundle over ongoing work.

## Existing clones after the repository rename

Check your remotes before changing them:

```bash
git remote -v
```

If your intended upstream is the active repository above but `origin` still uses its previous name, update it:

```bash
git remote set-url origin https://github.com/omar65978/wasl-support-platform.git
```

Contributors working through a fork should keep their own fork as the push remote.

## Configure commit identity

Set your real preferred Git name and an email verified on your account, or use the exact private noreply address provided by GitHub:

```bash
git config user.name "Your Name"
git config user.email "your-verified-email@example.com"
```

These settings affect future commits in this clone. Commit identity records metadata, not whether code was written manually or with assistance. Keep messages and descriptions accurate; do not fabricate development dates or rewrite others' contributions to imply sole authorship.

Use your credential manager, browser authentication, or SSH for authentication. Never embed a token in the remote URL, documentation, or source.

## Make and verify a focused change

Start from a clean working tree. Save existing changes before pulling; do not discard them to make an update succeed.

```bash
git status
git pull --ff-only origin main
```

If the pull refuses because histories diverged, inspect and reconcile the changes rather than force-pushing.

After making a change:

```bash
npm run format
npm run format:check
npm run verify
npm run build:vercel
npx playwright install --with-deps chromium
npm run test:e2e
git --no-pager diff
git status --short
```

Stage only the intended files. For example, for a customer-interface change:

```bash
git add apps/customer/src
git --no-pager diff --cached --stat
git diff --cached --check
git commit -m "fix(customer): improve request validation feedback"
```

Maintainers with write access can push the intended branch. External contributors should use a feature branch on a fork and open a pull request. See [Contributing](../CONTRIBUTING.md).

## Before publishing

```bash
git ls-files ".env*"
```

Only `.env.example`, `.env.seed.example`, and `.env.live.example` should appear. Private environment files, admin credentials, account passwords, local Auth state, `node_modules`, compiled output, and test reports must not be committed.

The repository's `.gitattributes` normalizes detected text files to LF. Use `npm run format` to align local formatting. Line-ending warnings are not evidence of a failed application build.

The Actions workflow checks formatting, builds, SQL/unit tests, Chromium workflows, and high-or-higher production dependency advisories. A successful push is not the same as a successful deployment: inspect Actions and the corresponding Vercel Production deployment.

## Optional bundles and archives

A Git bundle is useful for offline backups or transferring history, but it is not required for normal development. Follow [Optional packaging](PACKAGING.md) when creating one. One push transfers all reachable commits; the number of pushes is not the number of commits.

Earlier bundle-based setup instructions and their original context are preserved in [Historical documentation](history/README.md). They are not the recommended update path for an existing clone.
