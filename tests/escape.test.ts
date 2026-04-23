import { describe, it, expect } from 'vitest';
import { escapeBash, escapePowershell } from '../src/escape';

describe('escapeBash', () => {
  it('passes through simple strings', () => {
    expect(escapeBash('hello')).toBe('hello');
  });

  it('escapes double quotes', () => {
    expect(escapeBash('say "hi"')).toBe('say \\"hi\\"');
  });

  it('escapes backslashes', () => {
    expect(escapeBash('C:\\Users\\foo')).toBe('C:\\\\Users\\\\foo');
  });

  it('escapes dollar signs', () => {
    expect(escapeBash('$HOME')).toBe('\\$HOME');
  });

  it('escapes backticks', () => {
    expect(escapeBash('`cmd`')).toBe('\\`cmd\\`');
  });

  it('escapes multiple special chars together', () => {
    expect(escapeBash('$PATH="C:\\usr"')).toBe('\\$PATH=\\"C:\\\\usr\\"');
  });
});

describe('escapePowershell', () => {
  it('passes through simple strings', () => {
    expect(escapePowershell('hello')).toBe('hello');
  });

  it('escapes single quotes by doubling', () => {
    expect(escapePowershell("it's")).toBe("it''s");
  });

  it('escapes double quotes with backtick', () => {
    expect(escapePowershell('say "hi"')).toBe('say `"hi`"');
  });

  it('escapes dollar signs with backtick', () => {
    expect(escapePowershell('$env:PATH')).toBe('`$env:PATH');
  });
});
