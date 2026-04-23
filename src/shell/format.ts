import type { ShellType } from './detect';
import { escapeBash, escapePowershell } from '../escape';

export function formatVars(vars: Record<string, string>, shell: ShellType): string {
  const entries = Object.entries(vars);
  switch (shell) {
    case 'bash':
    case 'zsh':
      return entries.map(([k, v]) => `export ${k}="${escapeBash(v)}"`).join('\n');
    case 'powershell':
      return entries.map(([k, v]) => `$env:${k} = '${escapePowershell(v)}'`).join('\n');
  }
}
