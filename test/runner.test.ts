import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExtensionLauncherMapping } from '../src/core';
import { runExtensionLauncher, type ExtensionLauncherApi, type LauncherUri } from '../src/runner';

function createUri(path: string): LauncherUri {
  return {
    fsPath: `C:${path}`,
    path,
    toString: () => `file://${path}`
  };
}

function createApi(overrides: Partial<ExtensionLauncherApi> = {}): ExtensionLauncherApi {
  return {
    getConfiguredMappings: () => [],
    hasWorkspaceFolder: () => true,
    showWarningMessage: async () => undefined,
    openSettings: async () => {},
    showMappingQuickPick: async () => undefined,
    findFiles: async () => [],
    showInformationMessage: () => {},
    showFileQuickPick: async () => undefined,
    getAvailableCommands: async () => [],
    executeCommand: async () => {},
    showErrorMessage: () => {},
    ...overrides
  };
}

describe('runExtensionLauncher', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('offers to open settings when no mappings are configured', async () => {
    const openSettings = vi.fn(async () => {});

    await runExtensionLauncher(
      createApi({
        showWarningMessage: async (_message, action) => action,
        openSettings
      })
    );

    expect(openSettings).toHaveBeenCalledWith('extensionLauncher.mappings');
  });

  it('shows warning and stops when no workspace folder is open', async () => {
    const warning = vi.fn(async () => undefined);
    const mappingQuickPick = vi.fn(async () => undefined);

    await runExtensionLauncher(
      createApi({
        getConfiguredMappings: () => [{ title: 'BCS', extension: 'bcs', command: 'vscode.open' }],
        hasWorkspaceFolder: () => false,
        showWarningMessage: warning,
        showMappingQuickPick: mappingQuickPick
      })
    );

    expect(warning).toHaveBeenCalledWith(
      'Open a workspace folder first so Extension Launcher can search for files.'
    );
    expect(mappingQuickPick).not.toHaveBeenCalled();
  });

  it('shows an error when configured command is unavailable', async () => {
    const errorMessage = vi.fn();
    const mapping: ExtensionLauncherMapping = {
      title: 'BCS',
      extension: 'bcs',
      command: 'missing.command'
    };

    await runExtensionLauncher(
      createApi({
        getConfiguredMappings: () => [mapping],
        showMappingQuickPick: async () => mapping,
        findFiles: async () => [createUri('/workspace/src/main.bcs')],
        showFileQuickPick: async (files) => files[0],
        getAvailableCommands: async () => ['vscode.open'],
        showErrorMessage: errorMessage
      })
    );

    expect(errorMessage).toHaveBeenCalledWith(
      'Configured command not found: missing.command. Check extensionLauncher.mappings and ensure the providing extension is installed/enabled in this window.'
    );
  });

  it('skips mapping quick pick when exactly one mapping is configured', async () => {
    const mappingQuickPick = vi.fn(async () => undefined);
    const mapping: ExtensionLauncherMapping = {
      title: 'BCS',
      extension: 'bcs',
      command: 'example.command'
    };

    await runExtensionLauncher(
      createApi({
        getConfiguredMappings: () => [mapping],
        showMappingQuickPick: mappingQuickPick,
        findFiles: async () => [createUri('/workspace/src/main.bcs')],
        showFileQuickPick: async (files) => files[0],
        getAvailableCommands: async () => ['example.command']
      })
    );

    expect(mappingQuickPick).not.toHaveBeenCalled();
  });

  it('passes Uri object when commandArgs contains only ${uri}', async () => {
    const executeCommand = vi.fn(async () => {});
    const selectedUri = createUri('/workspace/src/main.bcs');
    const mapping: ExtensionLauncherMapping = {
      title: 'BCS',
      extension: '.bcs',
      command: 'example.command',
      commandArgs: ['${uri}', '${basename}', '${extension}']
    };

    await runExtensionLauncher(
      createApi({
        getConfiguredMappings: () => [mapping],
        showMappingQuickPick: async () => mapping,
        findFiles: async () => [selectedUri],
        showFileQuickPick: async (files) => files[0],
        getAvailableCommands: async () => ['example.command'],
        executeCommand
      })
    );

    expect(executeCommand).toHaveBeenCalledWith('example.command', selectedUri, 'main.bcs', 'bcs');
  });
});
