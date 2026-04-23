import { loadConfig, saveConfig, getConfigPath } from '../config';

export function runRemove(group: string, key: string): void {
  const configPath = getConfigPath();
  const config = loadConfig(configPath);
  if (!config.groups[group]) {
    throw new Error(`Group "${group}" not found. Available groups: ${Object.keys(config.groups).join(', ')}`);
  }
  if (!(key in config.groups[group])) {
    throw new Error(`Key "${key}" not found in group "${group}". Available keys: ${Object.keys(config.groups[group]).join(', ')}`);
  }
  delete config.groups[group][key];
  saveConfig(configPath, config);
}
