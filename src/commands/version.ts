import { readFileSync } from 'fs';
import { join } from 'path';

let _version: string | undefined;

export function runVersion(): string {
  if (!_version) {
    try {
      const pkgPath = join(__dirname, '..', '..', 'package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      _version = pkg.version ?? 'unknown';
    } catch {
      _version = 'unknown';
    }
  }
  return _version!;
}
