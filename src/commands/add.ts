import { loadConfig, saveConfig, getConfigPath } from '../config';

export function runAdd(group: string, key: string, value: string): void {
  const configPath = getConfigPath();
  const config = loadConfig(configPath);
  if (!config.groups[group]) {
    config.groups[group] = {};
  }
  config.groups[group][key] = value;
  saveConfig(configPath, config);
}
