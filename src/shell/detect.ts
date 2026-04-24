export type ShellType = 'bash' | 'zsh' | 'powershell';

export function detectShell(env: Record<string, string | undefined>): ShellType {
  const shell = env.SHELL || '';
  if (shell.includes('zsh')) return 'zsh';
  if (shell.includes('bash')) return 'bash';
  if (env.PSModulePath) return 'powershell';
  if (process.platform === 'win32') return 'powershell';
  return 'bash';
}
