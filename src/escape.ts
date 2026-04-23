export function escapeBash(value: string): string {
  return value.replace(/([$`"\\!])/g, '\\$1');
}

export function escapePowershell(value: string): string {
  return value
    .replace(/"/g, '`"')
    .replace(/'/g, "''")
    .replace(/\$/g, '`$');
}

