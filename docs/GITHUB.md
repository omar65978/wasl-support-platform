# Publishing to GitHub

## Preserve the supplied history

The delivery includes an incrementally created Git history. The companion `wasl-support.bundle` contains the branch and its commits without requiring hidden `.git` files to survive ZIP extraction.

From the extracted delivery directory:

```bash
git clone wasl-support.bundle wasl-platform
cd wasl-platform
git log --oneline --reverse
```

This creates a normal working repository on `main`. Source files are included separately in the archive for immediate browsing; cloning the bundle is the recommended publishing path. Generated production assets are intentionally absent from Git and can be rebuilt.

## Configure your identity for future work

```bash
git config user.name "Your Name"
git config user.email "your-email@example.com"
```

Existing commits retain their actual delivery author and timestamps. Do not rewrite them to imply that someone else authored the work. New changes will use your identity.

## Create an empty remote repository

On GitHub, choose **New repository**, select your visibility and repository name, and leave automatic README, license, and `.gitignore` creation **disabled**. The repository already contains its README and ignore rules.

Then replace `YOUR_USERNAME` and `YOUR_REPOSITORY` below:

```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git branch -M main
git push -u origin main
```

The clone's old `origin` points to the local bundle, which is why it is removed first. Use GitHub's browser/device sign-in, credential manager, SSH, or a scoped token stored by your Git client. Never put a token in the remote URL or commit it.

**One push publishes every existing commit.** Multiple commits do not require multiple uploads or repeated pushes. Do not squash the supplied history if your evaluation expects incremental work.

## Commit structure

The delivery uses ten logical commits spanning:

1. Workspace scaffolding and initial dependency setup.
2. Shared models and database authorization/lifecycle.
3. React customer workflows and bilingual visual foundation.
4. Angular support operations and manager experience.
5. Database security tests, browser workflows, and live verification tooling.
6. Quality fixes, contrast, concurrency hardening, and consistent formatting.
7. Architecture, backend setup, requirements, and demonstration documentation.
8. Deployment, CI, and publication instructions.
9. Final verification and tested UX/security refinements.
10. Reproducible delivery packaging and handoff records.

Use `git log --oneline --reverse` to inspect the exact commit messages. This number is appropriate for a two-application milestone delivery: the commits represent actual work boundaries rather than arbitrary file splitting.

## Verify before publishing

```bash
npm ci
npm run format:check
npm run verify
npx playwright install --with-deps chromium
npm run test:e2e
git status --short
git ls-files ".env*"
```

The last command should show only `.env.example`, `.env.seed.example`, and `.env.live.example`. No real passwords, `.env.seed`, `.env.live`, database URIs with credentials, or admin keys should be tracked.

GitHub Actions runs formatting, production builds, SQL/unit tests, browser tests, and the production dependency audit. It does not execute the hosted integration suite because that suite needs private test-user credentials and a configured test project.

## Later changes

Keep commits focused and describe the actual change:

```bash
git add apps/customer/src
 git commit -m "fix(customer): improve request validation feedback"
git push
```

Before staging, inspect `git diff`. Avoid uploading `node_modules`, generated builds, test reports, or private environment files. If a secret is accidentally committed, revoke/rotate it first; simply deleting it in a later commit does not remove it from history.

## Starting without the bundle

If organizational policy requires a new repository, `git init` on the source folder is possible, but it discards the implementation history. Do not recreate artificial development dates or claim a one-commit import is the original history. Prefer the bundle unless there is a specific reason not to preserve it.
