import type { ShellType } from '../shell/detect';
import { loadConfig, getConfigPath } from '../config';
import { formatVars } from '../shell/format';

export function runSet(group: string, shell: ShellType): string {
  const configPath = getConfigPath();
  const config = loadConfig(configPath);
  const vars = config.groups[group];
  if (!vars) {
    const available = Object.keys(config.groups);
    throw new Error(`Group "${group}" not found. Available groups: ${available.join(', ')}`);
  }
  return formatVars(vars, shell);
}
