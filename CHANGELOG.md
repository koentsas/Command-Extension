# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog.

## [Unreleased]

## [0.0.4] - 2026-06-03

### Changed

- `workbench.action.terminal.sendSequence` mappings now run in a dedicated terminal named after the mapping title. The terminal is reused when it already exists.

## [0.0.3] - 2026-05-28

### Added

- New command: `extension-launcher.runFromExplorer` to launch directly from Explorer right-click on files.
- New setting: `extensionLauncher.commandAvailability` to control launcher entry visibility (`both`, `contextMenu`, `commandPalette`).
- New per-mapping setting: `commandAvailability` inside `extensionLauncher.mappings` to filter mapping eligibility by launch source.

### Changed

- Explorer context command now filters mappings by selected file extension and only prompts when multiple eligible mappings exist.
- Command Palette flow now only lists mappings eligible for palette launches.

### Fixed

- Explorer context-menu visibility now uses config-based `when` clauses so it appears reliably in debug Extension Development Host.
- Explorer launch now does a silent no-op when no eligible mapping exists for the selected file extension.

## [0.0.2] - 2026-05-27

### Fixed

- Use the file selected in Extension Launcher when `${uri}` is used as a standalone command argument by passing the Uri object through.
- Skip the mapping quick pick when only one mapping is configured.

### Changed

- Clarified `${uri}` token behavior in README for standalone vs embedded usage.

## [0.0.1] - 2026-05-27

### Added

- Initial public release of Extension Launcher.
- Command: Extension Launcher: Run (`extension-launcher.run`).
- Command: Extension Launcher: Ping (`extension-launcher.ping`).
- Config setting: `extensionLauncher.mappings` for title, file extension, command id, and optional command arguments.
- Token replacement support in command arguments (`${uri}`, `${fsPath}`, `${path}`, `${basename}`, `${dirname}`, `${extension}`).
- Build and release scripts for linting, type-checking, tests, packaging, and publishing.

[Unreleased]: https://github.com/koentsas/Command-Extension/compare/v0.0.4...HEAD
[0.0.4]: https://github.com/koentsas/Command-Extension/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/koentsas/Command-Extension/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/koentsas/Command-Extension/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/koentsas/Command-Extension/releases/tag/v0.0.1
