# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog.

## [Unreleased]

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

[Unreleased]: https://github.com/koentsas/Command-Extension/compare/v0.0.2...HEAD
[0.0.2]: https://github.com/koentsas/Command-Extension/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/koentsas/Command-Extension/releases/tag/v0.0.1
