import { describe, expect, it } from 'vitest';

import {
  asNonEmptyString,
  buildCommandArgs,
  escapeForGlob,
  normalizeExtension,
  parseConfiguredMappings,
  resolveTokens,
  type ExtensionLauncherMapping,
  type UriTokenValues
} from '../src/core';

const sampleUri: UriTokenValues = {
  uri: 'file:///workspace/src/main.bcs',
  fsPath: 'C:/workspace/src/main.bcs',
  path: '/workspace/src/main.bcs'
};

describe('parseConfiguredMappings', () => {
  it('keeps valid mappings and normalizes extension', () => {
    const parsed = parseConfiguredMappings([
      {
        title: 'Open BCS',
        extension: '.BCS',
        command: 'vscode.open'
      },
      {
        title: 'Invalid Mapping',
        extension: '   ',
        command: 'vscode.open'
      }
    ]);

    expect(parsed).toEqual([
      {
        title: 'Open BCS',
        extension: 'bcs',
        command: 'vscode.open',
        commandArgs: undefined
      }
    ]);
  });
});

describe('buildCommandArgs', () => {
  it('returns default URI argument when commandArgs is omitted', () => {
    const mapping: ExtensionLauncherMapping = {
      title: 'Default',
      extension: 'bcs',
      command: 'vscode.open'
    };

    const defaultArg = { uri: 'vscode-uri-object' };
    const args = buildCommandArgs(mapping, sampleUri, defaultArg);

    expect(args).toEqual([defaultArg]);
  });

  it('resolves tokens in nested commandArgs', () => {
    const mapping: ExtensionLauncherMapping = {
      title: 'Token mapping',
      extension: '.BCS',
      command: 'example.command',
      commandArgs: [
        '${uri}',
        {
          fsPath: '${fsPath}',
          nested: ['${path}', '${basename}', '${dirname}', '${extension}']
        }
      ]
    };

    const args = buildCommandArgs(mapping, sampleUri, { fallback: true });

    expect(args).toEqual([
      'file:///workspace/src/main.bcs',
      {
        fsPath: 'C:/workspace/src/main.bcs',
        nested: ['/workspace/src/main.bcs', 'main.bcs', '/workspace/src', 'bcs']
      }
    ]);
  });
});

describe('helpers', () => {
  it('normalizes extension values', () => {
    expect(normalizeExtension('.Ts')).toBe('ts');
    expect(normalizeExtension('...JSON')).toBe('json');
    expect(normalizeExtension(undefined)).toBe('');
  });

  it('escapes glob metacharacters', () => {
    expect(escapeForGlob('[a]{b}*?.txt')).toBe('ab.txt');
  });

  it('converts empty/whitespace strings to undefined', () => {
    expect(asNonEmptyString('  value  ')).toBe('value');
    expect(asNonEmptyString('   ')).toBeUndefined();
    expect(asNonEmptyString(42)).toBeUndefined();
  });

  it('resolves tokens recursively for arrays and objects', () => {
    const result = resolveTokens(
      {
        a: '${uri}',
        b: ['${basename}', { c: '${dirname}' }],
        d: true
      },
      sampleUri,
      'bcs'
    );

    expect(result).toEqual({
      a: 'file:///workspace/src/main.bcs',
      b: ['main.bcs', { c: '/workspace/src' }],
      d: true
    });
  });
});
