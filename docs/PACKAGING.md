# Optional source and build archives

Normal development starts with a clone of the active repository and a local build. An archive is an optional distribution or backup format, not a prerequisite for running or publishing the application.

The packaging script is `scripts/package-delivery.py`. It requires Python 3 and Git in addition to Node.js 22.x and npm 10 or later, and uses only the Python standard library.

## Prepare a release snapshot

From the repository root:

```bash
npm ci
npm run format:check
npm run verify
npx playwright install --with-deps chromium
npm run test:e2e
npm run build:vercel
git status --short
```

Review and commit intended source changes before packaging. The script refuses a dirty working tree and private tracked `.env` files. Its guard is not a comprehensive secret scanner: inspect the tracked files and Git history before sharing an archive.

Create the archive:

```bash
python3 scripts/package-delivery.py
```

On Windows, if Python is installed through the Python launcher, use:

```bat
py scripts/package-delivery.py
```

The default output is a sibling `deliverables/` directory. An optional argument selects another output directory; keep it outside the source tree.

## What is included

```text
Wasl-Delivery/
  START-HERE-AR.md
  COMMIT-HISTORY.txt
  DELIVERY-MANIFEST.json
  wasl-support.bundle
  wasl-support/
    README.md
    apps/
    packages/
    supabase/
    scripts/
    tests/
    docs/
```

The script retains these existing archive names for compatibility. The source directory contains Git-tracked files plus both compiled application builds. The Git bundle carries history. Generated dependencies, private environment files, test reports, and the original `.git/config` are not added as standalone files.

The bundle is created with `--all`, so it includes all local refs selected by Git, not just the current branch. Inspect refs and reachable history before distributing it; files deleted in later commits may still exist in the bundle's history. Never package a repository with committed secrets. Revoke exposed credentials rather than relying on deleting the latest copy.

The output filename follows `package.json`: `Wasl-Support-Platform-v<VERSION>.zip`. This does not create a Git tag or publish a release. Keep package version, release notes, tags, and uploaded assets consistent when actually preparing a release.

## Verify the archive

The generated manifest records the source commit and per-file SHA-256 hashes. `SHA256SUMS.txt` records the ZIP checksum.

On a shell with `sha256sum`:

```bash
sha256sum -c SHA256SUMS.txt
```

On PowerShell, use `Get-FileHash` with the actual generated filename and compare it with `SHA256SUMS.txt`.

To inspect the preserved history, run `git bundle verify` from an initialized Git repository, or clone the bundle into a new directory:

```bash
git clone -b main wasl-support.bundle wasl-platform-copy
```

That clone needs `npm ci` and `npm run build` before previewing. The archive's compiled source folder can instead run `node scripts/serve.mjs` directly if the compiled assets are present.

A Git bundle is not a backup of hosted issues, pull requests, account permissions, deployment settings, Auth users, or database contents. Back up those systems separately where required.

The [previous packaging guide](history/before-refresh-PACKAGING.md) is retained as a historical record.
