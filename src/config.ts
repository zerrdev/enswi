import fs from 'fs';
import path from 'path';
import os from 'os';
import { parse, stringify } from 'yaml';

export interface EnswiConfig {
  groups: Record<string, Record<string, string>>;
}

function normalizeVars(vars: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(vars)) {
    result[key] = String(val);
  }
  return result;
}

export function getConfigPath(): string {
  if (process.platform === 'win32') {
    const appdata = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appdata, 'enswi', 'config.yml');
  }
  const home = process.env.HOME || os.homedir();
  return path.join(home, '.config', 'enswi', 'config.yml');
}

export function loadConfig(configPath: string): EnswiConfig {
  const raw = fs.readFileSync(configPath, 'utf-8');
  let parsed: unknown;
  try {
    parsed = parse(raw);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to parse ${configPath}: ${msg}`);
  }
  if (!parsed || typeof parsed !== 'object') {
    return { groups: {} };
  }
  const root = parsed as Record<string, unknown>;
  if (!root.groups || typeof root.groups !== 'object') {
    return { groups: {} };
  }
  const groups: Record<string, Record<string, string>> = {};
  for (const [groupName, vars] of Object.entries(root.groups as Record<string, unknown>)) {
    if (vars && typeof vars === 'object') {
      groups[groupName] = normalizeVars(vars as Record<string, unknown>);
    }
  }
  return { groups };
}

export function saveConfig(configPath: string, config: EnswiConfig): void {
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, stringify({ groups: config.groups }), 'utf-8');
}

export function ensureConfigExists(): void {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    saveConfig(configPath, { groups: {} });
  }
}
