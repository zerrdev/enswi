import { describe, it, expect } from 'vitest';
import { detectShell, type ShellType } from '../src/shell/detect';
import { formatVars } from '../src/shell/format';
import { getWrapper, getProfilePaths } from '../src/shell/wrappers';

describe('detectShell', () => {
  it('detects bash from SHELL env', () => {
    expect(detectShell({ SHELL: '/bin/bash' })).toBe('bash');
  });

  it('detects zsh from SHELL env', () => {
    expect(detectShell({ SHELL: '/bin/zsh' })).toBe('zsh');
  });

  it('detects powershell from PSModulePath', () => {
    expect(detectShell({ PSModulePath: 'C:\\Users\\foo\\Documents\\PowerShell\\Modules' }))
      .toBe('powershell');
  });

  it('defaults to bash when nothing matches', () => {
    expect(detectShell({})).toBe('bash');
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
    expect(getWrapper('powershell')).toContain('Get-Command -CommandType Application');
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
