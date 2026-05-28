import * as vscode from 'vscode';
import { parseConfiguredMappings, type ExtensionLauncherMapping } from './core.js';
import {
  runExtensionLauncher,
  runExtensionLauncherForFile,
  type ExtensionLauncherApi,
  type LauncherUri
} from './runner.js';

export function activate(context: vscode.ExtensionContext): void {
  const pingCommand = vscode.commands.registerCommand('extension-launcher.ping', () => {
    void vscode.window.showInformationMessage('Extension Launcher is active.');
  });

  const extensionLauncherCommand = vscode.commands.registerCommand(
    'extension-launcher.run',
    async () => {
      try {
        await runExtensionLauncher(createLauncherApi());
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`Extension Launcher failed: ${message}`);
      }
    }
  );

  const explorerLauncherCommand = vscode.commands.registerCommand(
    'extension-launcher.runFromExplorer',
    async (resource?: vscode.Uri) => {
      if (!resource) {
        void vscode.window.showWarningMessage('No file selected from Explorer.');
        return;
      }

      try {
        await runExtensionLauncherForFile(createLauncherApi(), resource);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`Extension Launcher failed: ${message}`);
      }
    }
  );

  context.subscriptions.push(pingCommand, extensionLauncherCommand, explorerLauncherCommand);
}

export function deactivate(): void {
  // no-op
}

function getConfiguredMappings(): ExtensionLauncherMapping[] {
  const config = vscode.workspace.getConfiguration('extensionLauncher');
  const rawMappings = config.get<unknown[]>('mappings', []);
  return parseConfiguredMappings(rawMappings);
}

function createLauncherApi(): ExtensionLauncherApi {
  return {
    getConfiguredMappings,
    hasWorkspaceFolder: () =>
      !!vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0,
    showWarningMessage: (message: string, action?: string) =>
      action
        ? vscode.window.showWarningMessage(message, action)
        : vscode.window.showWarningMessage(message),
    openSettings: async (query: string) => {
      await vscode.commands.executeCommand('workbench.action.openSettings', query);
    },
    showMappingQuickPick: async (mappings: ExtensionLauncherMapping[]) => {
      const mappingPick = await vscode.window.showQuickPick(
        mappings.map((mapping) => ({
          label: mapping.title,
          description: `*.${mapping.extension}`,
          detail: mapping.command,
          mapping
        })),
        {
          title: 'Extension Launcher: Select Mapping',
          placeHolder: 'Choose the configured extension/command mapping'
        }
      );

      return mappingPick?.mapping;
    },
    findFiles: async (pattern: string) =>
      vscode.workspace.findFiles(pattern, '**/{.git,node_modules}/**'),
    showInformationMessage: (message: string) => {
      void vscode.window.showInformationMessage(message);
    },
    showFileQuickPick: async (files: LauncherUri[], extension: string) => {
      const uriFiles = files as vscode.Uri[];
      const filePick = await vscode.window.showQuickPick(
        uriFiles.map((uri) => ({
          label: vscode.workspace.asRelativePath(uri),
          description: uri.fsPath,
          uri
        })),
        {
          title: `Extension Launcher: Select .${extension} File`,
          placeHolder: 'Choose a file to open with the configured command',
          matchOnDescription: true
        }
      );

      return filePick?.uri;
    },
    getAvailableCommands: () => vscode.commands.getCommands(true),
    executeCommand: (command: string, ...args: unknown[]) =>
      vscode.commands.executeCommand(command, ...args),
    showErrorMessage: (message: string) => {
      void vscode.window.showErrorMessage(message);
    }
  };
}
