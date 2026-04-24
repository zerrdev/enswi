#!/usr/bin/env node

import { Command } from 'commander';
import { detectShell, type ShellType } from './shell/detect';
import { ensureConfigExists } from './config';
import { runSet } from './commands/set';
import { runList } from './commands/list';
import { runVersion } from './commands/version';
import { runAdd } from './commands/add';
import { runRemove } from './commands/remove';
import { runConfig } from './commands/config-cmd';
import { runSetup } from './commands/setup';
import { getProfilePaths } from './shell/wrappers';

function getShell(option?: string): ShellType {
  if (option) {
    const valid: ShellType[] = ['bash', 'zsh', 'powershell'];
    if (!valid.includes(option as ShellType)) {
      console.error(`Invalid shell "${option}". Valid options: ${valid.join(', ')}`);
      process.exit(1);
    }
    return option as ShellType;
  }
  return detectShell(process.env);
}

const program = new Command();

// All commander output (help, version, errors) goes to stderr.
// Only the set command uses console.log() for stdout (to be eval'd by the wrapper).
program.configureOutput({
  writeOut: (str: string) => process.stderr.write(str),
  writeErr: (str: string) => process.stderr.write(str),
});

program
  .name('enswi')
  .description('Set env vars from named groups in your shell')
  .version(runVersion(), '-v, --version', 'output the current version')
  .helpOption('-h, --help', 'display help for enswi');

program
  .command('setup')
  .description('Install shell wrapper functions')
  .option('--shell <shell>', 'specific shell to set up (bash, zsh, powershell, cmd)')
  .action((opts) => {
    const shells: ShellType[] = opts.shell
      ? [opts.shell as ShellType]
      : ['bash', 'zsh', 'powershell'];
    for (const shell of shells) {
      const paths = getProfilePaths(shell);
      for (const p of paths) {
        runSetup(shell, p);
      }
    }
    console.error('\nRestart your shell for changes to take effect.');
  });

program
  .command('config')
  .description('Open config.yml in your editor')
  .action(() => {
    ensureConfigExists();
    runConfig();
  });

program
  .command('add <group> <keyValue>')
  .description('Add KEY=VAL to a group (creates group if new)')
  .action((group: string, keyValue: string) => {
    const eqIndex = keyValue.indexOf('=');
    if (eqIndex === -1) {
      console.error('Format: enswi add <group> <KEY=VALUE>');
      process.exit(1);
    }
    const key = keyValue.slice(0, eqIndex);
    const value = keyValue.slice(eqIndex + 1);
    ensureConfigExists();
    runAdd(group, key, value);
    console.error(`Added ${key} to group "${group}".`);
  });

program
  .command('remove <group> <key>')
  .description('Remove a var from a group')
  .action((group: string, key: string) => {
    ensureConfigExists();
    runRemove(group, key);
    console.error(`Removed ${key} from group "${group}".`);
  });

program
  .command('list [group]')
  .description('List all groups or vars in a group')
  .action((group?: string) => {
    ensureConfigExists();
    const output = runList(group);
    console.error(output);
  });

program
  .command('version')
  .description('Print version')
  .action(() => {
    console.error(runVersion());
  });

program
  .command('load <group>')
  .description('Activate a group (set env vars in current shell)')
  .option('--shell <shell>', 'override detected shell (bash, zsh, powershell)')
  .action((group: string, opts: { shell?: string }) => {
    ensureConfigExists();
    const shell = getShell(opts.shell);
    try {
      const output = runSet(group, shell);
      // set command output goes to stdout (to be eval'd)
      console.log(output);
    } catch (err: unknown) {
      console.error((err as Error).message);
      process.exit(1);
    }
  });

program.parse();
