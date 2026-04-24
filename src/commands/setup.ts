import fs from 'fs';
import path from 'path';
import type { ShellType } from '../shell/detect';
import { getWrapper } from '../shell/wrappers';

const MARKER = '# enswi wrapper';

export function runSetup(shell: ShellType, profilePath: string): void {
  const wrapper = getWrapper(shell);
  let content = '';

  if (fs.existsSync(profilePath)) {
    content = fs.readFileSync(profilePath, 'utf-8');
  }

  // Remove any existing wrapper block (marker line through the wrapper code)
  if (content.includes(MARKER)) {
    const lines = content.split('\n');
    const result: string[] = [];
    let skipping = false;
    for (const line of lines) {
      if (line === MARKER) {
        skipping = true;
        continue;
      }
      if (skipping) {
        // Empty line or start of unrelated content ends the wrapper block
        if (line.trim() === '' || (!line.startsWith(' ') && !line.startsWith('\t') && !line.startsWith('function') && !line.startsWith('enswi'))) {
          skipping = false;
          result.push(line);
        }
        continue;
      }
      result.push(line);
    }
    content = result.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  content = content ? `${content}\n\n${wrapper}\n` : `${wrapper}\n`;

  const dir = path.dirname(profilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(profilePath, content, 'utf-8');
  console.error(`Installed enswi wrapper for ${shell} in ${profilePath}`);
}
