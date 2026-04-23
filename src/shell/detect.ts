export type ShellType = 'bash' | 'zsh' | 'powershell' | 'cmd';

export function detectShell(env: Record<string, string | undefined>): ShellType {
  const shell = env.SHELL || '';
  const psModule = env.PSModulePath || '';
  const comspec = env.COMSPEC || '';

  if (shell.includes('zsh')) return 'zsh';
  if (shell.includes('bash')) return 'bash';
  if (psModule) return 'powershell';
  if (comspec.toLowerCase().includes('cmd.exe')) return 'cmd';
  return 'bash';
}
