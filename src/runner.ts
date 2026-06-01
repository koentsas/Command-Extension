import {
  buildCommandArgs,
  extensionFromPath,
  escapeForGlob,
  isMappingAvailableForSource,
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
  ensureNamedTerminal(name: string): PromiseLike<void>;
  executeCommand(command: string, ...args: unknown[]): PromiseLike<void>;
  showErrorMessage(message: string): void;
}

const TERMINAL_SEND_SEQUENCE_COMMAND = 'workbench.action.terminal.sendSequence';

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

  const sourceMappings = mappings.filter((mapping) =>
    isMappingAvailableForSource(mapping, 'commandPalette')
  );
  if (sourceMappings.length === 0) {
    return;
  }

  if (!api.hasWorkspaceFolder()) {
    api.showWarningMessage(
      'Open a workspace folder first so Extension Launcher can search for files.'
    );
    return;
  }

  const selectedMapping =
    sourceMappings.length === 1
      ? sourceMappings[0]
      : await api.showMappingQuickPick(sourceMappings);
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

  await executeMappingForFile(api, selectedMapping, selectedFile);
}

export async function runExtensionLauncherForFile(
  api: ExtensionLauncherApi,
  targetFile: LauncherUri
): Promise<void> {
  const mappings = api.getConfiguredMappings();

  const fileExtension = extensionFromPath(targetFile.path);
  if (!fileExtension) {
    api.showInformationMessage('No context menu mappings found for the selected file.');
    return;
  }

  const matchingMappings = mappings.filter(
    (mapping) =>
      mapping.extension === fileExtension && isMappingAvailableForSource(mapping, 'contextMenu')
  );
  if (matchingMappings.length === 0) {
    api.showInformationMessage(`No context menu mappings found for .${fileExtension} files.`);
    return;
  }

  const selectedMapping =
    matchingMappings.length === 1
      ? matchingMappings[0]
      : await api.showMappingQuickPick(matchingMappings);
  if (!selectedMapping) {
    return;
  }

  await executeMappingForFile(api, selectedMapping, targetFile);
}

async function executeMappingForFile(
  api: ExtensionLauncherApi,
  mapping: ExtensionLauncherMapping,
  selectedFile: LauncherUri
): Promise<void> {
  const availableCommands = await api.getAvailableCommands();
  if (!availableCommands.includes(mapping.command)) {
    api.showErrorMessage(
      `Configured command not found: ${mapping.command}. Check extensionLauncher.mappings and ensure the providing extension is installed/enabled in this window.`
    );
    return;
  }

  const uriValues: UriTokenValues = {
    uri: selectedFile.toString(),
    fsPath: selectedFile.fsPath,
    path: selectedFile.path,
    uriObject: selectedFile
  };

  if (requiresDedicatedTerminal(mapping.command)) {
    await api.ensureNamedTerminal(mapping.title);
  }

  const args = buildCommandArgs(mapping, uriValues, selectedFile);
  await api.executeCommand(mapping.command, ...args);
}

function requiresDedicatedTerminal(command: string): boolean {
  return command === TERMINAL_SEND_SEQUENCE_COMMAND;
}
