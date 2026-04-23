export type ShellType = 'bash' | 'zsh' | 'powershell';

export function detectShell(env: Record<string, string | undefined>): ShellType {
  const shell = env.SHELL || '';
  const psModule = env.PSModulePath || '';

  if (shell.includes('zsh')) return 'zsh';
  if (shell.includes('bash')) return 'bash';
  if (psModule) return 'powershell';
  return 'bash';
}
