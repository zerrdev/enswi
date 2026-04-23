import fs from 'fs';
import path from 'path';
import type { ShellType } from '../shell/detect';
import { getWrapper } from '../shell/wrappers';

const MARKER = '# enswi wrapper';

export function runSetup(shell: ShellType, profilePath: string): void {
  const wrapper = getWrapper(shell);

  if (fs.existsSync(profilePath)) {
    const existing = fs.readFileSync(profilePath, 'utf-8');
    if (existing.includes(MARKER)) {
      console.error(`enswi wrapper already installed in ${profilePath}`);
      return;
    }
    fs.appendFileSync(profilePath, `\n${wrapper}\n`, 'utf-8');
  } else {
    const dir = path.dirname(profilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(profilePath, `${wrapper}\n`, 'utf-8');
  }

  console.error(`Installed enswi wrapper for ${shell} in ${profilePath}`);
}
