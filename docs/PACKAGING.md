# Reproducing the delivery archive

The archive contains:

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

The source folder includes both compiled application builds, so `node scripts/serve.mjs` can serve them without installing npm packages. Git intentionally excludes these generated files; cloning the bundle requires a normal build.

## Create the package

The optional packaging tool needs Python 3 and Git in addition to the normal Node toolchain. It uses only the Python standard library.

```bash
npm ci
npm run verify
npm run test:e2e
npm run format:check
git status --short
python3 scripts/package-delivery.py
```

Commit any intended source changes before packaging. The script refuses a dirty repository and refuses tracked private `.env` files. It packages only Git-tracked source, the two production build folders, documentation, and the verified Git bundle. It does not include `node_modules`, admin credentials, local Auth state, test reports, or the original `.git/config`.

By default, the archive, standalone bundle, and checksum are written to a sibling `deliverables/` directory. An optional first argument selects another output directory.

The manifest records the source commit and per-file SHA-256 hashes. `SHA256SUMS.txt` records the complete ZIP hash. The bundle preserves all supplied commits and can be cloned using standard Git.

## Verify a download

```bash
sha256sum -c SHA256SUMS.txt
git bundle verify wasl-support.bundle
```

Run the checksum command from the download directory and the bundle command from an initialized Git repository, or clone the bundle directly. On PowerShell, use `Get-FileHash Wasl-Support-Platform.zip -Algorithm SHA256` and compare its value with the checksum file.

## Archive versus repository

Use the source folder for immediate preview. Use `git clone wasl-support.bundle wasl-platform` for development and publication with history. They represent the same source commit; the archive adds generated builds for convenience.
