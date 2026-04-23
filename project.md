# CLI tool to set env vars from a group

## Commands

enswi <group-name>
- Set env vars for a group
enswi config
- Opens a file (config.yml) to edit groups. Probably stored in a %appdata%/enswi/config.yml or something like that.
```
enswi cglm
```
### Will set env vars from the group cglm in the current terminal

```
enswi ck2
```
### Will set env vars from the group cglm in the current terminal

## Functionality
- Detects the current terminal (bash, powershell, cmd)
- Set env vars for the current shell
- They can overlap each other