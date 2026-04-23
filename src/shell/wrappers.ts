import path from 'path';
import os from 'os';
import type { ShellType } from './detect';

const WRAPPER_MARKER = '# enswi wrapper';

const wrappers: Record<ShellType, string> = {
  bash: [
    WRAPPER_MARKER,
    'enswi() { eval "$(command enswi "$@")"; }',
  ].join('\n'),
  zsh: [
    WRAPPER_MARKER,
    'enswi() { eval "$(command enswi "$@")"; }',
  ].join('\n'),
  powershell: [
    WRAPPER_MARKER,
    'function enswi { Invoke-Expression (& command enswi @args | Out-String) }',
  ].join('\n'),
  cmd: [
    '@echo off',
    'for /f "delims=" %%i in (\'node "%~dp0enswi-cli.js" %*\') do %%i',
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
      return [path.join(docs, 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1')];
    }
    case 'cmd': {
      const appdata = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
      return [path.join(appdata, 'enswi', 'enswi.cmd')];
    }
  }
}
