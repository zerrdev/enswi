# enswi CLI — Design Spec

## Overview

`enswi` is a Node.js/TypeScript CLI tool that sets environment variables in the current shell session from named groups defined in a YAML config file. It supports PowerShell, Bash, CMD, and Unix shells (zsh, etc.).

Distribution: npm global package.

## Commands

```
enswi setup                   # Install shell wrapper into detected profiles
enswi setup --shell bash      # Install for a specific shell only
enswi <group>                 # Set env vars for that group
enswi config                  # Open config.yml in $EDITOR / Notepad
enswi add <group> <KEY=VAL>   # Add a var to a group (creates group if new)
enswi remove <group> <KEY>    # Remove a var from a group
enswi list                    # List all group names
enswi list <group>            # Show vars in a group
enswi version                 # Print version (from package.json)
enswi --help / -h             # Print help
```

Unknown commands print help. `enswi <group>` where group doesn't exist prints an error with available groups.

## Architecture

**Approach: Thin eval wrapper.** A minimal shell function calls the Node CLI and evals its stdout. All logic lives in TypeScript — the shell wrappers are trivial one-liners.

When `enswi <group>` runs, the Node CLI prints shell-native `export`/`set` commands to stdout. All other output (list, errors, help) goes to stderr so it isn't eval'd.

## Config File

**Location:**
- Windows: `%APPDATA%\enswi\config.yml`
- Unix: `~/.config/enswi/config.yml`

**Format:**
```yaml
groups:
  cglm:
    ANTHROPIC_BASE_URL: "https://api.z.ai/api/anthropic"
    ANTHROPIC_AUTH_TOKEN: "mykey"
    API_TIMEOUT_MS: "3000000"
  ck2:
    ENABLE_TOOL_SEARCH: false
    ANTHROPIC_BASE_URL: https://api.kimi.com/coding/
    ANTHROPIC_API_KEY: mykey2
```

**Normalization:** All values are converted to strings in the env (`false` → `"false"`, `3000000` → `"3000000"`). Both `KEY: "value"` and `KEY: value` are accepted. Group names are case-sensitive.

**First run:** If `config.yml` doesn't exist, `enswi` creates the directory and an empty `groups: {}` file.

## Shell Wrappers

### Setup (`enswi setup`)

1. Detect available shells by checking for profile files
2. Append wrapper function to each found profile
3. Skip if wrapper already exists (idempotent)
4. Print what was set up, remind user to restart shell

**Profile locations:**
- PowerShell: `$PROFILE` (e.g. `Documents/PowerShell/Microsoft.PowerShell_profile.ps1`)
- Bash: `~/.bashrc` (or `~/.bash_profile` on macOS)
- Zsh: `~/.zshrc`
- CMD: `.cmd` wrapper placed in `%APPDATA%\enswi\` added to PATH

### Wrapper Functions

```bash
# Bash/Zsh
enswi() { eval "$(command enswi "$@")"; }
```

```powershell
# PowerShell
function enswi { Invoke-Expression (& command enswi @args | Out-String) }
```

```batch
# CMD — enswi-cmd.cmd placed in %APPDATA%\enswi\, added to PATH
@echo off
for /f "delims=" %%i in ('node "%~dp0enswi-cli.js" %*') do %%i
```

Note: The CMD wrapper calls `node` directly since npm global `.cmd` shims can't be eval'd. The wrapper script is placed alongside the npm-installed package or references it by path found during `enswi setup`.

### Shell Detection

The Node CLI checks `SHELL` env var (Unix) and `PSModulePath` / `COMSPEC` (Windows). Overridable with `--shell` flag.

## Output Format

**Bash/Zsh:**
```bash
export KEY="value"
```

**PowerShell:**
```powershell
$env:KEY = "value"
```

**CMD:**
```batch
set KEY=value
```

Values with special characters (quotes, backslashes, shell metacharacters) are escaped per target shell rules.

## Group Behavior

- **Merge on overlap:** Running `enswi ck2` after `enswi cglm` overwrites overlapping vars, leaves non-overlapping cglm vars in place.
- **No auto-unset:** Switching groups does not unset previous group's vars.

## Project Structure

```
enswi/
├── src/
│   ├── cli.ts              # Entry point, argument parsing
│   ├── config.ts            # Config file read/write, YAML parsing
│   ├── commands/
│   │   ├── set.ts           # enswi <group> — output env vars
│   │   ├── setup.ts         # enswi setup — install shell wrappers
│   │   ├── config-cmd.ts    # enswi config — open editor
│   │   ├── add.ts           # enswi add <group> <KEY=VAL>
│   │   ├── remove.ts        # enswi remove <group> <KEY>
│   │   ├── list.ts          # enswi list [group]
│   │   └── version.ts       # enswi version
│   ├── shell/
│   │   ├── detect.ts        # Detect current shell
│   │   ├── format.ts        # Format env vars per shell
│   │   └── wrappers.ts      # Wrapper templates + profile paths
│   └── escape.ts            # Value escaping per shell
├── package.json
├── tsconfig.json
└── config.yml               # Sample config (for reference)
```

**Dependencies:** `yaml` (or `js-yaml`), `commander`. Nothing else.

**Build:** TypeScript compiled to `dist/`, `bin` entry in `package.json`.

## Error Handling

- **Group not found:** Error to stderr with list of available groups
- **Config file missing:** Auto-create empty config
- **Malformed YAML:** Parse error with file path and line number, exit non-zero
- **Missing args:** Print usage help
- **Already-configured profile:** Skip with "already set up" message
- **Special chars in values:** Escaped per shell rules
