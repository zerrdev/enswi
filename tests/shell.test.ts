import { describe, it, expect } from 'vitest';
import { detectShell, type ShellType } from '../src/shell/detect';
import { formatVars } from '../src/shell/format';
import { getWrapper, getProfilePaths } from '../src/shell/wrappers';

describe('detectShell', () => {
  it('detects bash from SHELL even when PSModulePath is set (Git Bash on Windows)', () => {
    expect(detectShell({ SHELL: '/bin/bash', PSModulePath: 'C:\\Users\\foo\\Documents\\PowerShell\\Modules' }))
      .toBe('bash');
  });

  it('detects zsh from SHELL even when PSModulePath is set', () => {
    expect(detectShell({ SHELL: '/bin/zsh', PSModulePath: 'C:\\Users\\foo\\Documents\\PowerShell\\Modules' }))
      .toBe('zsh');
  });

  it('detects powershell from PSModulePath alone', () => {
    expect(detectShell({ PSModulePath: 'C:\\Users\\foo\\Documents\\PowerShell\\Modules' }))
      .toBe('powershell');
  });

  it('detects bash from SHELL env', () => {
    expect(detectShell({ SHELL: '/bin/bash' })).toBe('bash');
  });

  it('detects zsh from SHELL env', () => {
    expect(detectShell({ SHELL: '/bin/zsh' })).toBe('zsh');
  });

  it('defaults to powershell on windows, bash otherwise', () => {
    const expected: ShellType = process.platform === 'win32' ? 'powershell' : 'bash';
    expect(detectShell({})).toBe(expected);
  });
});

describe('formatVars', () => {
  const vars: Record<string, string> = {
    API_KEY: 'secret123',
    BASE_URL: 'https://api.example.com',
  };

  it('formats for bash', () => {
    const out = formatVars(vars, 'bash');
    expect(out).toBe('export API_KEY="secret123"\nexport BASE_URL="https://api.example.com"');
  });

  it('formats for zsh', () => {
    const out = formatVars(vars, 'zsh');
    expect(out).toBe('export API_KEY="secret123"\nexport BASE_URL="https://api.example.com"');
  });

  it('formats for powershell', () => {
    const out = formatVars(vars, 'powershell');
    expect(out).toBe("$env:API_KEY = 'secret123'\n$env:BASE_URL = 'https://api.example.com'");
  });

  it('escapes special chars in values', () => {
    const specialVars = { PATH_VAR: '$HOME/path' };
    expect(formatVars(specialVars, 'bash')).toContain('\\$HOME/path');
    expect(formatVars(specialVars, 'powershell')).toContain('`$HOME/path');
  });
});

describe('getWrapper', () => {
  it('returns bash wrapper string', () => {
    expect(getWrapper('bash')).toContain('eval "$(command enswi "$@")"');
  });

  it('returns zsh wrapper string', () => {
    expect(getWrapper('zsh')).toContain('eval "$(command enswi "$@")"');
  });

  it('returns powershell wrapper string', () => {
    const w = getWrapper('powershell');
    expect(w).toContain('Invoke-Expression');
    expect(w).toContain('Get-Command -CommandType Application enswi');
    expect(w).toContain('.Source');
  });
});

describe('getProfilePaths', () => {
  it('returns non-empty array of profile paths for bash', () => {
    const paths = getProfilePaths('bash');
    expect(paths.length).toBeGreaterThan(0);
    expect(paths[0]).toContain('.bashrc');
  });

  it('returns powershell profile path', () => {
    const paths = getProfilePaths('powershell');
    expect(paths.length).toBeGreaterThan(0);
  });
});
