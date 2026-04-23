import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadConfig } from '../src/config';
import { runSet } from '../src/commands/set';
import { runList } from '../src/commands/list';
import { runVersion } from '../src/commands/version';

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
