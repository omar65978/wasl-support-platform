import hashlib
import json
from pathlib import Path
import subprocess
import sys
import zipfile

root = Path(__file__).resolve().parent.parent
output = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else root.parent / 'deliverables'
output.mkdir(parents=True, exist_ok=True)


def git(*args):
    return subprocess.check_output(['git', '-C', str(root), *args])


if git('status', '--porcelain').strip():
    raise SystemExit('Commit all source changes before packaging the delivery.')

tracked = [Path(name) for name in git('ls-files', '-z').decode().split('\0') if name]
for name in tracked:
    if name.name.startswith('.env') and not name.name.endswith('.example'):
        raise SystemExit(f'Refusing to package private environment file: {name}')

compiled = []
for directory in ['apps/customer/dist', 'apps/support/dist/browser']:
    folder = root / directory
    if not (folder / 'index.html').exists():
        raise SystemExit('Run npm run build before creating the delivery.')
    compiled.extend(path.relative_to(root) for path in folder.rglob('*') if path.is_file())

bundle = output / 'wasl-support.bundle'
subprocess.run(['git', '-C', str(root), 'bundle', 'create', str(bundle), '--all'], check=True)
subprocess.run(['git', '-C', str(root), 'bundle', 'verify', str(bundle)], check=True)
history = git('log', '--reverse', '--format=%h %s').decode()
version = json.loads((root / 'package.json').read_text())['version']
archive = output / f'Wasl-Support-Platform-v{version}.zip'
manifest = {'commit': git('rev-parse', 'HEAD').decode().strip(), 'files': {}}

with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as package:
    for relative in sorted(set(tracked + compiled)):
        content = (root / relative).read_bytes()
        name = f'Wasl-Delivery/wasl-support/{relative.as_posix()}'
        package.writestr(name, content)
        manifest['files'][name] = hashlib.sha256(content).hexdigest()
    package.write(bundle, 'Wasl-Delivery/wasl-support.bundle')
    package.writestr('Wasl-Delivery/COMMIT-HISTORY.txt', history)
    package.writestr('Wasl-Delivery/START-HERE-AR.md', (root / 'docs/HANDOFF-AR.md').read_bytes())
    package.writestr('Wasl-Delivery/DELIVERY-MANIFEST.json', json.dumps(manifest, indent=2))

with zipfile.ZipFile(archive) as package:
    damaged = package.testzip()
    if damaged:
        raise SystemExit(f'Archive verification failed: {damaged}')

checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
(output / 'SHA256SUMS.txt').write_text(f'{checksum}  {archive.name}\n')
print(f'Created {archive} ({archive.stat().st_size:,} bytes)')
print(f'SHA256: {checksum}')
print(history)
