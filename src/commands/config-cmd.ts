import { execSync } from 'child_process';
import { getConfigPath } from '../config';

export function runConfig(): void {
  const configPath = getConfigPath();
  const editor = process.env.EDITOR || process.env.VISUAL || 'notepad';
  execSync(`${editor} "${configPath}"`, { stdio: 'inherit' });
}
