import { loadConfig, getConfigPath } from '../config';

export function runList(group: string | undefined): string {
  const configPath = getConfigPath();
  const config = loadConfig(configPath);

  if (!group) {
    return Object.keys(config.groups).join('\n');
  }

  const vars = config.groups[group];
  if (!vars) {
    throw new Error(`Group "${group}" not found. Available groups: ${Object.keys(config.groups).join(', ')}`);
  }

  return Object.entries(vars).map(([k, v]) => `${k}=${v}`).join('\n');
}
