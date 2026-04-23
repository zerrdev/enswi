import path from 'path';
import os from 'os';
import type { ShellType } from './detect';

const WRAPPER_MARKER = '# enswi wrapper';

const wrappers: Record<ShellType, string> = {
  bash: [
    WRAPPER_MARKER,
    'enswi() { if [ "$1" = "load" ]; then eval "$(command enswi "$@")"; else command enswi "$@"; fi; }',
  ].join('\n'),
  zsh: [
    WRAPPER_MARKER,
    'enswi() { if [ "$1" = "load" ]; then eval "$(command enswi "$@")"; else command enswi "$@"; fi; }',
  ].join('\n'),
  powershell: [
    WRAPPER_MARKER,
    'function enswi { if ($args[0] -eq "load") { $o = & (Get-Command -CommandType Application enswi | Select-Object -First 1).Source @args; if ($o) { Invoke-Expression ($o -join "`n") } } else { & (Get-Command -CommandType Application enswi | Select-Object -First 1).Source @args } }',
  ].join('\n'),
};

export function getWrapper(shell: ShellType): string {
  return wrappers[shell];
}

export function getProfilePaths(shell: ShellType): string[] {
  const home = os.homedir();
  switch (shell) {
    case 'bash':
      return [path.join(home, '.bashrc'), path.join(home, '.bash_profile')];
    case 'zsh':
      return [path.join(home, '.zshrc')];
    case 'powershell': {
      const docs = process.env.USERPROFILE || home;
      return [
        path.join(docs, 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1'),
        path.join(docs, 'Documents', 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1'),
      ];
    }
  }
}
