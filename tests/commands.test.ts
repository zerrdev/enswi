import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadConfig } from '../src/config';
import { runSet } from '../src/commands/set';
import { runList } from '../src/commands/list';
import { runVersion } from '../src/commands/version';
import { runAdd } from '../src/commands/add';
import { runRemove } from '../src/commands/remove';
import { runSetup } from '../src/commands/setup';

let tmpDir: string;
let origAppdata: string | undefined;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'enswi-test-'));
  origAppdata = process.env.APPDATA;
});

afterEach(() => {
  process.env.APPDATA = origAppdata;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeConfig(groups: Record<string, Record<string, string>>) {
  process.env.APPDATA = tmpDir;
  const dir = path.join(tmpDir, 'enswi');
  fs.mkdirSync(dir, { recursive: true });
  const configPath = path.join(dir, 'config.yml');
  const { stringify } = require('yaml');
  fs.writeFileSync(configPath, stringify({ groups }), 'utf-8');
  return configPath;
}

describe('runSet', () => {
  it('outputs bash export statements', () => {
    writeConfig({ cglm: { API_KEY: 'secret', PORT: '8080' } });
    const output = runSet('cglm', 'bash');
    expect(output).toBe('export API_KEY="secret"\nexport PORT="8080"');
  });

  it('outputs powershell set statements', () => {
    writeConfig({ cglm: { API_KEY: 'secret' } });
    const output = runSet('cglm', 'powershell');
    expect(output).toBe("$env:API_KEY = 'secret'");
  });

  it('throws if group not found', () => {
    writeConfig({ cglm: { API_KEY: 'secret' } });
    expect(() => runSet('nonexistent', 'bash')).toThrow('Group "nonexistent" not found');
  });

  it('includes available groups in error message', () => {
    writeConfig({ cglm: {}, ck2: {} });
    try {
      runSet('nope', 'bash');
      expect.unreachable('should have thrown');
    } catch (err: unknown) {
      expect((err as Error).message).toContain('cglm');
      expect((err as Error).message).toContain('ck2');
    }
  });
});

describe('runList', () => {
  it('lists all group names', () => {
    writeConfig({ alpha: { K: 'V' }, beta: { K2: 'V2' } });
    const output = runList(undefined);
    expect(output).toContain('alpha');
    expect(output).toContain('beta');
  });

  it('lists vars in a specific group', () => {
    writeConfig({ mygroup: { KEY1: 'val1', KEY2: 'val2' } });
    const output = runList('mygroup');
    expect(output).toContain('KEY1=val1');
    expect(output).toContain('KEY2=val2');
  });

  it('throws if group not found', () => {
    writeConfig({ existing: {} });
    expect(() => runList('nope')).toThrow('Group "nope" not found');
  });
});

describe('runVersion', () => {
  it('returns version string', () => {
    const output = runVersion();
    expect(output).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('runAdd', () => {
  it('adds a var to an existing group', () => {
    const configPath = writeConfig({ mygroup: { K1: 'v1' } });
    runAdd('mygroup', 'NEW_KEY', 'new_val');
    const config = loadConfig(configPath);
    expect(config.groups['mygroup']['K1']).toBe('v1');
    expect(config.groups['mygroup']['NEW_KEY']).toBe('new_val');
  });

  it('creates a new group if it does not exist', () => {
    writeConfig({});
    const configPath = path.join(tmpDir, 'enswi', 'config.yml');
    runAdd('fresh', 'KEY', 'val');
    const config = loadConfig(configPath);
    expect(config.groups['fresh']).toEqual({ KEY: 'val' });
  });

  it('overwrites existing var in group', () => {
    writeConfig({ g: { K: 'old' } });
    const configPath = path.join(tmpDir, 'enswi', 'config.yml');
    runAdd('g', 'K', 'new');
    const config = loadConfig(configPath);
    expect(config.groups['g']['K']).toBe('new');
  });
});

describe('runRemove', () => {
  it('removes a var from a group', () => {
    writeConfig({ g: { K1: 'v1', K2: 'v2' } });
    const configPath = path.join(tmpDir, 'enswi', 'config.yml');
    runRemove('g', 'K1');
    const config = loadConfig(configPath);
    expect(config.groups['g']).toEqual({ K2: 'v2' });
  });

  it('throws if group not found', () => {
    writeConfig({});
    expect(() => runRemove('nope', 'K')).toThrow('Group "nope" not found');
  });

  it('throws if key not found in group', () => {
    writeConfig({ g: { K1: 'v1' } });
    expect(() => runRemove('g', 'MISSING')).toThrow('Key "MISSING" not found');
  });
});

describe('runSetup', () => {
  it('appends wrapper to bash profile file', () => {
    const profilePath = path.join(tmpDir, '.bashrc');
    fs.writeFileSync(profilePath, '# existing content\n');
    runSetup('bash', profilePath);
    const content = fs.readFileSync(profilePath, 'utf-8');
    expect(content).toContain('# existing content');
    expect(content).toContain('eval "$(command enswi "$@")"');
  });

  it('skips if wrapper already present', () => {
    const profilePath = path.join(tmpDir, '.bashrc');
    runSetup('bash', profilePath);
    const content1 = fs.readFileSync(profilePath, 'utf-8');
    runSetup('bash', profilePath);
    const content2 = fs.readFileSync(profilePath, 'utf-8');
    expect(content1).toBe(content2);
  });

  it('creates profile file if it does not exist', () => {
    const profilePath = path.join(tmpDir, '.bashrc');
    expect(fs.existsSync(profilePath)).toBe(false);
    runSetup('bash', profilePath);
    expect(fs.existsSync(profilePath)).toBe(true);
    const content = fs.readFileSync(profilePath, 'utf-8');
    expect(content).toContain('eval "$(command enswi "$@")"');
  });

  it('appends powershell wrapper', () => {
    const profilePath = path.join(tmpDir, 'profile.ps1');
    runSetup('powershell', profilePath);
    const content = fs.readFileSync(profilePath, 'utf-8');
    expect(content).toContain('Invoke-Expression');
  });
});
