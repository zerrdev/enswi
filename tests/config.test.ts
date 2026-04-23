import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadConfig, saveConfig, getConfigPath, ensureConfigExists } from '../src/config';

let tmpDir: string;
let origAppdata: string | undefined;
let origHome: string | undefined;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'enswi-test-'));
  origAppdata = process.env.APPDATA;
  origHome = process.env.HOME;
});

afterEach(() => {
  process.env.APPDATA = origAppdata;
  process.env.HOME = origHome;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('getConfigPath', () => {
  it('returns %APPDATA%/enswi/config.yml on Windows', () => {
    process.env.APPDATA = tmpDir;
    expect(getConfigPath()).toBe(path.join(tmpDir, 'enswi', 'config.yml'));
  });

  it('returns ~/.config/enswi/config.yml on Unix', () => {
    process.env.HOME = tmpDir;
    Object.defineProperty(process, 'platform', { value: 'linux' });
    expect(getConfigPath()).toBe(path.join(tmpDir, '.config', 'enswi', 'config.yml'));
    Object.defineProperty(process, 'platform', { value: 'win32' });
  });
});

describe('loadConfig', () => {
  it('parses a valid config file', () => {
    const configPath = path.join(tmpDir, 'config.yml');
    fs.writeFileSync(configPath, `
groups:
  cglm:
    ANTHROPIC_BASE_URL: "https://api.z.ai"
    API_TIMEOUT_MS: 3000000
    ENABLE_THING: false
  ck2:
    ANTHROPIC_API_KEY: mykey2
`);
    const config = loadConfig(configPath);
    expect(config.groups).toBeDefined();
    expect(config.groups['cglm']).toEqual({
      ANTHROPIC_BASE_URL: 'https://api.z.ai',
      API_TIMEOUT_MS: '3000000',
      ENABLE_THING: 'false',
    });
    expect(config.groups['ck2']).toEqual({
      ANTHROPIC_API_KEY: 'mykey2',
    });
  });

  it('normalizes all values to strings', () => {
    const configPath = path.join(tmpDir, 'config.yml');
    fs.writeFileSync(configPath, `
groups:
  g1:
    NUM: 42
    BOOL: true
    STR: "hello"
`);
    const config = loadConfig(configPath);
    expect(config.groups['g1']['NUM']).toBe('42');
    expect(config.groups['g1']['BOOL']).toBe('true');
    expect(config.groups['g1']['STR']).toBe('hello');
  });

  it('throws on malformed YAML with file path', () => {
    const configPath = path.join(tmpDir, 'bad.yml');
    fs.writeFileSync(configPath, 'groups: [\n  bad: {');
    expect(() => loadConfig(configPath)).toThrow(configPath);
  });

  it('returns empty config for empty file', () => {
    const configPath = path.join(tmpDir, 'empty.yml');
    fs.writeFileSync(configPath, '');
    const config = loadConfig(configPath);
    expect(config.groups).toEqual({});
  });
});

describe('saveConfig', () => {
  it('writes config to YAML file', () => {
    const configPath = path.join(tmpDir, 'out.yml');
    saveConfig(configPath, {
      groups: {
        mygroup: { KEY1: 'val1', KEY2: 'val2' },
      },
    });
    const content = fs.readFileSync(configPath, 'utf-8');
    expect(content).toContain('KEY1: val1');
    expect(content).toContain('KEY2: val2');
    const config = loadConfig(configPath);
    expect(config.groups['mygroup']).toEqual({ KEY1: 'val1', KEY2: 'val2' });
  });
});

describe('ensureConfigExists', () => {
  it('creates config file and directory if missing', () => {
    process.env.APPDATA = tmpDir;
    const configPath = path.join(tmpDir, 'enswi', 'config.yml');
    expect(fs.existsSync(configPath)).toBe(false);
    ensureConfigExists();
    expect(fs.existsSync(configPath)).toBe(true);
    const config = loadConfig(configPath);
    expect(config.groups).toEqual({});
  });

  it('does not overwrite existing config', () => {
    process.env.APPDATA = tmpDir;
    const dir = path.join(tmpDir, 'enswi');
    fs.mkdirSync(dir, { recursive: true });
    const configPath = path.join(dir, 'config.yml');
    fs.writeFileSync(configPath, 'groups:\n  existing:\n    K: V\n');
    ensureConfigExists();
    const config = loadConfig(configPath);
    expect(config.groups['existing']).toEqual({ K: 'V' });
  });
});
