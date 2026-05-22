import * as vscode from 'vscode';
import {
  buildCommandArgs,
  escapeForGlob,
  parseConfiguredMappings,
  type ExtensionLauncherMapping
} from './core.js';

export function activate(context: vscode.ExtensionContext): void {
  const pingCommand = vscode.commands.registerCommand('extension-launcher.ping', () => {
    void vscode.window.showInformationMessage('Extension Launcher is active.');
  });

  const extensionLauncherCommand = vscode.commands.registerCommand(
    'extension-launcher.run',
    async () => {
      const mappings = getConfiguredMappings();

      if (mappings.length === 0) {
        const action = 'Open Settings';
        const result = await vscode.window.showWarningMessage(
          'No Extension Launcher mappings are configured yet.',
          action
        );
        if (result === action) {
          await vscode.commands.executeCommand(
            'workbench.action.openSettings',
            'extensionLauncher.mappings'
          );
        }
        return;
      }

      if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        void vscode.window.showWarningMessage(
          'Open a workspace folder first so Extension Launcher can search for files.'
        );
        return;
      }

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

      if (!mappingPick) {
        return;
      }

      const selectedMapping = mappingPick.mapping;
      const pattern = `**/*.${escapeForGlob(selectedMapping.extension)}`;
      const files = await vscode.workspace.findFiles(pattern, '**/{.git,node_modules}/**');

      if (files.length === 0) {
        void vscode.window.showInformationMessage(
          `No files found for extension .${selectedMapping.extension}`
        );
        return;
      }

      const filePick = await vscode.window.showQuickPick(
        files.map((uri) => ({
          label: vscode.workspace.asRelativePath(uri),
          description: uri.fsPath,
          uri
        })),
        {
          title: `Extension Launcher: Select .${selectedMapping.extension} File`,
          placeHolder: 'Choose a file to open with the configured command',
          matchOnDescription: true
        }
      );

      if (!filePick) {
        return;
      }

      try {
        const availableCommands = await vscode.commands.getCommands(true);
        if (!availableCommands.includes(selectedMapping.command)) {
          void vscode.window.showErrorMessage(
            `Configured command not found: ${selectedMapping.command}. Check extensionLauncher.mappings and ensure the providing extension is installed/enabled in this window.`
          );
          return;
        }

        const args = buildCommandArgs(
          selectedMapping,
          {
            uri: filePick.uri.toString(),
            fsPath: filePick.uri.fsPath,
            path: filePick.uri.path
          },
          filePick.uri
        );
        await vscode.commands.executeCommand(selectedMapping.command, ...args);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(
          `Extension Launcher failed running command ${selectedMapping.command}: ${message}`
        );
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
