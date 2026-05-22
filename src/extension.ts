import * as vscode from 'vscode';
import { parseConfiguredMappings, type ExtensionLauncherMapping } from './core.js';
import { runExtensionLauncher } from './runner.js';

export function activate(context: vscode.ExtensionContext): void {
  const pingCommand = vscode.commands.registerCommand('extension-launcher.ping', () => {
    void vscode.window.showInformationMessage('Extension Launcher is active.');
  });

  const extensionLauncherCommand = vscode.commands.registerCommand(
    'extension-launcher.run',
    async () => {
      try {
        await runExtensionLauncher({
          getConfiguredMappings,
          hasWorkspaceFolder: () =>
            !!vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0,
          showWarningMessage: (message, action) =>
            action
              ? vscode.window.showWarningMessage(message, action)
              : vscode.window.showWarningMessage(message),
          openSettings: async (query) => {
            await vscode.commands.executeCommand('workbench.action.openSettings', query);
          },
          showMappingQuickPick: async (mappings) => {
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
          findFiles: async (pattern) =>
            vscode.workspace.findFiles(pattern, '**/{.git,node_modules}/**'),
          showInformationMessage: (message) => {
            void vscode.window.showInformationMessage(message);
          },
          showFileQuickPick: async (files, extension) => {
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
          executeCommand: (command, ...args) => vscode.commands.executeCommand(command, ...args),
          showErrorMessage: (message) => {
            void vscode.window.showErrorMessage(message);
          }
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`Extension Launcher failed: ${message}`);
      }
    }
  );

  context.subscriptions.push(pingCommand, extensionLauncherCommand);
}

export function deactivate(): void {
  // no-op
}

function getConfiguredMappings(): ExtensionLauncherMapping[] {
  const config = vscode.workspace.getConfiguration('extensionLauncher');
  const rawMappings = config.get<unknown[]>('mappings', []);
  return parseConfiguredMappings(rawMappings);
}
