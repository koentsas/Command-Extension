import {
  buildCommandArgs,
  escapeForGlob,
  type ExtensionLauncherMapping,
  type UriTokenValues
} from './core.js';

export type LauncherUri = {
  toString(): string;
  fsPath: string;
  path: string;
};

export interface ExtensionLauncherApi {
  getConfiguredMappings(): ExtensionLauncherMapping[];
  hasWorkspaceFolder(): boolean;
  showWarningMessage(message: string, action?: string): PromiseLike<string | undefined>;
  openSettings(query: string): PromiseLike<void>;
  showMappingQuickPick(
    mappings: ExtensionLauncherMapping[]
  ): PromiseLike<ExtensionLauncherMapping | undefined>;
  findFiles(pattern: string): PromiseLike<LauncherUri[]>;
  showInformationMessage(message: string): void;
  showFileQuickPick(files: LauncherUri[], extension: string): PromiseLike<LauncherUri | undefined>;
  getAvailableCommands(): PromiseLike<string[]>;
  executeCommand(command: string, ...args: unknown[]): PromiseLike<void>;
  showErrorMessage(message: string): void;
}

export async function runExtensionLauncher(api: ExtensionLauncherApi): Promise<void> {
  const mappings = api.getConfiguredMappings();

  if (mappings.length === 0) {
    const action = 'Open Settings';
    const result = await api.showWarningMessage(
      'No Extension Launcher mappings are configured yet.',
      action
    );
    if (result === action) {
      await api.openSettings('extensionLauncher.mappings');
    }
    return;
  }

  if (!api.hasWorkspaceFolder()) {
    api.showWarningMessage(
      'Open a workspace folder first so Extension Launcher can search for files.'
    );
    return;
  }

  const selectedMapping =
    mappings.length === 1 ? mappings[0] : await api.showMappingQuickPick(mappings);
  if (!selectedMapping) {
    return;
  }

  const pattern = `**/*.${escapeForGlob(selectedMapping.extension)}`;
  const files = await api.findFiles(pattern);

  if (files.length === 0) {
    api.showInformationMessage(`No files found for extension .${selectedMapping.extension}`);
    return;
  }

  const selectedFile = await api.showFileQuickPick(files, selectedMapping.extension);
  if (!selectedFile) {
    return;
  }

  const availableCommands = await api.getAvailableCommands();
  if (!availableCommands.includes(selectedMapping.command)) {
    api.showErrorMessage(
      `Configured command not found: ${selectedMapping.command}. Check extensionLauncher.mappings and ensure the providing extension is installed/enabled in this window.`
    );
    return;
  }

  const uriValues: UriTokenValues = {
    uri: selectedFile.toString(),
    fsPath: selectedFile.fsPath,
    path: selectedFile.path,
    uriObject: selectedFile
  };

  const args = buildCommandArgs(selectedMapping, uriValues, selectedFile);
  await api.executeCommand(selectedMapping.command, ...args);
}
