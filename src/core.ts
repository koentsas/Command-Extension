export type ExtensionLauncherMapping = {
  title: string;
  extension: string;
  command: string;
  commandAvailability?: CommandAvailability;
  commandArgs?: unknown[];
};

export type CommandAvailability = 'both' | 'contextMenu' | 'commandPalette';

export type LaunchSource = 'contextMenu' | 'commandPalette';

export type UriTokenValues = {
  uri: string;
  fsPath: string;
  path: string;
  uriObject?: unknown;
};

export function parseConfiguredMappings(rawMappings: unknown[]): ExtensionLauncherMapping[] {
  const validMappings: ExtensionLauncherMapping[] = [];

  for (const raw of rawMappings) {
    if (!raw || typeof raw !== 'object') {
      continue;
    }

    const mapping = raw as Record<string, unknown>;
    const title = asNonEmptyString(mapping.title);
    const extension = normalizeExtension(asNonEmptyString(mapping.extension));
    const command = asNonEmptyString(mapping.command);
    const commandAvailability = normalizeCommandAvailability(mapping.commandAvailability);
    const commandArgs = Array.isArray(mapping.commandArgs) ? mapping.commandArgs : undefined;

    if (!title || !extension || !command) {
      continue;
    }

    validMappings.push({
      title,
      extension,
      command,
      commandAvailability,
      commandArgs
    });
  }

  return validMappings;
}

export function buildCommandArgs(
  mapping: ExtensionLauncherMapping,
  uriValues: UriTokenValues,
  defaultArg: unknown
): unknown[] {
  if (!mapping.commandArgs || mapping.commandArgs.length === 0) {
    return [defaultArg];
  }

  const extension = normalizeExtension(mapping.extension);
  return mapping.commandArgs.map((arg) => resolveTokens(arg, uriValues, extension));
}

export function resolveTokens(
  value: unknown,
  uriValues: UriTokenValues,
  extension: string
): unknown {
  if (typeof value === 'string') {
    if (value === '${uri}') {
      return uriValues.uriObject ?? uriValues.uri;
    }

    return value
      .replaceAll('${uri}', uriValues.uri)
      .replaceAll('${fsPath}', uriValues.fsPath)
      .replaceAll('${path}', uriValues.path)
      .replaceAll('${basename}', basenameFromPath(uriValues.path))
      .replaceAll('${dirname}', dirnameFromPath(uriValues.path))
      .replaceAll('${extension}', extension);
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveTokens(item, uriValues, extension));
  }

  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = resolveTokens(val, uriValues, extension);
    }
    return result;
  }

  return value;
}

export function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function normalizeExtension(extension: string | undefined): string {
  if (!extension) {
    return '';
  }
  return extension.trim().replace(/^\.+/, '').toLowerCase();
}

export function escapeForGlob(value: string): string {
  return value
    .replaceAll('[', '')
    .replaceAll(']', '')
    .replaceAll('{', '')
    .replaceAll('}', '')
    .replaceAll('*', '')
    .replaceAll('?', '');
}

export function extensionFromPath(uriPath: string): string {
  const base = basenameFromPath(uriPath);
  const dotIndex = base.lastIndexOf('.');

  if (dotIndex < 0 || dotIndex === base.length - 1) {
    return '';
  }

  return normalizeExtension(base.slice(dotIndex + 1));
}

export function isMappingAvailableForSource(
  mapping: ExtensionLauncherMapping,
  source: LaunchSource
): boolean {
  const availability = normalizeCommandAvailability(mapping.commandAvailability);

  return availability === 'both' || availability === source;
}

export function normalizeCommandAvailability(value: unknown): CommandAvailability {
  if (value === 'both' || value === 'contextMenu' || value === 'commandPalette') {
    return value;
  }

  return 'both';
}

function basenameFromPath(uriPath: string): string {
  return uriPath.split('/').pop() ?? '';
}

function dirnameFromPath(uriPath: string): string {
  const separatorIndex = uriPath.lastIndexOf('/');
  return separatorIndex >= 0 ? uriPath.slice(0, separatorIndex) : '';
}
