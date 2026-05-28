import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExtensionLauncherMapping } from '../src/core';
import {
  runExtensionLauncher,
  runExtensionLauncherForFile,
  type ExtensionLauncherApi,
  type LauncherUri
} from '../src/runner';

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
        getConfiguredMappings: () => [
          {
            title: 'BCS',
            extension: 'bcs',
            command: 'vscode.open',
            commandAvailability: 'commandPalette'
          }
        ],
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
      command: 'example.command',
      commandAvailability: 'commandPalette'
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
      commandAvailability: 'commandPalette',
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

  it('only considers command palette eligible mappings', async () => {
    const mappingQuickPick = vi.fn(async (mappings: ExtensionLauncherMapping[]) => mappings[0]);
    const executeCommand = vi.fn(async () => {});
    const selectedUri = createUri('/workspace/src/main.bcs');

    await runExtensionLauncher(
      createApi({
        getConfiguredMappings: () => [
          {
            title: 'Context Only',
            extension: 'bcs',
            command: 'example.context',
            commandAvailability: 'contextMenu'
          },
          {
            title: 'Palette Only',
            extension: 'bcs',
            command: 'example.palette',
            commandAvailability: 'commandPalette'
          }
        ],
        showMappingQuickPick: mappingQuickPick,
        findFiles: async () => [selectedUri],
        showFileQuickPick: async (files) => files[0],
        getAvailableCommands: async () => ['example.palette'],
        executeCommand
      })
    );

    expect(mappingQuickPick).not.toHaveBeenCalled();
    expect(executeCommand).toHaveBeenCalledWith('example.palette', selectedUri);
  });
});

describe('runExtensionLauncherForFile', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('runs directly when exactly one mapping matches selected file extension', async () => {
    const executeCommand = vi.fn(async () => {});
    const mappingQuickPick = vi.fn(async () => undefined);
    const targetUri = createUri('/workspace/src/main.bcs');

    await runExtensionLauncherForFile(
      createApi({
        getConfiguredMappings: () => [
          {
            title: 'BCS Open',
            extension: 'bcs',
            command: 'example.open',
            commandAvailability: 'contextMenu'
          },
          {
            title: 'JSON Open',
            extension: 'json',
            command: 'example.json',
            commandAvailability: 'contextMenu'
          }
        ],
        getAvailableCommands: async () => ['example.open', 'example.json'],
        showMappingQuickPick: mappingQuickPick,
        executeCommand
      }),
      targetUri
    );

    expect(mappingQuickPick).not.toHaveBeenCalled();
    expect(executeCommand).toHaveBeenCalledWith('example.open', targetUri);
  });

  it('shows mapping choice when multiple mappings match selected file extension', async () => {
    const executeCommand = vi.fn(async () => {});
    const selectedMapping: ExtensionLauncherMapping = {
      title: 'Run Task',
      extension: 'bcs',
      command: 'example.task',
      commandAvailability: 'both'
    };
    const targetUri = createUri('/workspace/src/main.bcs');

    await runExtensionLauncherForFile(
      createApi({
        getConfiguredMappings: () => [
          {
            title: 'Open',
            extension: 'bcs',
            command: 'example.open',
            commandAvailability: 'contextMenu'
          },
          selectedMapping
        ],
        getAvailableCommands: async () => ['example.open', 'example.task'],
        showMappingQuickPick: async (mappings) => {
          expect(mappings).toHaveLength(2);
          expect(mappings.every((m) => m.extension === 'bcs')).toBe(true);
          return selectedMapping;
        },
        executeCommand
      }),
      targetUri
    );

    expect(executeCommand).toHaveBeenCalledWith('example.task', targetUri);
  });

  it('does nothing when no context-menu eligible mapping exists for selected file extension', async () => {
    const information = vi.fn();
    const executeCommand = vi.fn(async () => {});

    await runExtensionLauncherForFile(
      createApi({
        getConfiguredMappings: () => [
          {
            title: 'BCS Palette Only',
            extension: 'bcs',
            command: 'example.palette',
            commandAvailability: 'commandPalette'
          }
        ],
        showInformationMessage: information,
        executeCommand
      }),
      createUri('/workspace/src/main.bcs')
    );

    expect(information).toHaveBeenCalledWith(
      'No context menu mappings found for .bcs files.'
    );
    expect(executeCommand).not.toHaveBeenCalled();
  });

  it('shows a message when selected file has no extension', async () => {
    const information = vi.fn();
    const executeCommand = vi.fn(async () => {});

    await runExtensionLauncherForFile(
      createApi({
        getConfiguredMappings: () => [
          {
            title: 'BCS Open',
            extension: 'bcs',
            command: 'example.open',
            commandAvailability: 'contextMenu'
          }
        ],
        showInformationMessage: information,
        executeCommand
      }),
      createUri('/workspace/src/README')
    );

    expect(information).toHaveBeenCalledWith('No context menu mappings found for the selected file.');
    expect(executeCommand).not.toHaveBeenCalled();
  });
});
