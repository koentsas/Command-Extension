# Extension Launcher

Launch configured commands for files by extension.

This extension is built with:

- TypeScript
- esbuild
- ESLint + Prettier
- Command contribution starter

## Extension Launcher

This extension includes a command named `Extension Launcher` that lets you:

1. Pick a configured mapping (title + extension + command).
2. List files in the workspace that match that extension.
3. Select one file.
4. Execute the configured command for that file.

It also adds an Explorer context-menu entry:

1. Right-click a file in Explorer.
2. Choose `Extension Launcher`.
3. The extension matches mappings by the selected file extension.
4. If one mapping matches, it runs immediately.
5. If multiple mappings match, you choose from a quick pick.

Configure mappings in your VS Code settings:

```json
"extensionLauncher.mappings": [
	{
		"title": "Open BCS In Editor",
		"extension": ".bcs",
		"command": "vscode.open",
		"commandAvailability": "both"
	},
	{
		"title": "Run Task: Process BCS File",
		"extension": ".bcs",
		"command": "workbench.action.tasks.runTask",
		"commandAvailability": "contextMenu",
		"commandArgs": ["Process Current BCS"]
	},
	{
		"title": "Open Workspace Settings Search",
		"extension": ".json",
		"command": "workbench.action.openSettings",
		"commandAvailability": "commandPalette",
		"commandArgs": ["files.associations"]
	},
	{
		"title": "Send File Info To Terminal",
		"extension": ".bcs",
		"command": "workbench.action.terminal.sendSequence",
		"commandAvailability": "both",
		"commandArgs": [
			{
				"text": "echo FILE=${fsPath} NAME=${basename} EXT=${extension}\u000D"
			}
		]
	}
]
```

Control where the launcher is shown:

```json
"extensionLauncher.commandAvailability": "both"
```

Allowed values:

- `both` (default): show in Explorer context menu and Command Palette (F1).
- `contextMenu`: show only in Explorer context menu.
- `commandPalette`: show only in Command Palette (F1).

Per mapping, you can also set `commandAvailability`:

- `both` (default): mapping is eligible from both Explorer context menu and Command Palette.
- `contextMenu`: mapping is eligible only from Explorer context menu launches.
- `commandPalette`: mapping is eligible only from Command Palette launches.

Behavior:

- Explorer context launch: if no mapping for that file extension is eligible for `both/contextMenu`, nothing happens.
- Command Palette launch: only mappings eligible for `both/commandPalette` are shown in subsequent selection menus.

Example notes:

- `vscode.open`: omit `commandArgs` so the selected file `Uri` is passed automatically.
- `workbench.action.tasks.runTask`: pass the task label exactly as defined in your `tasks.json`.
- `workbench.action.openSettings`: useful when you want to jump to a specific setting query.
- `workbench.action.terminal.sendSequence`: uses a dedicated terminal named after the mapping `title` (reused if it already exists), then sends the sequence there.

`commandArgs` is optional.

- If `commandArgs` is omitted, the selected file URI is passed automatically.
- If provided, you can use tokens inside string arguments:
  - `${uri}` selected file `Uri` object when used as a whole value, otherwise URI string when embedded in larger text
  - `${fsPath}` absolute file path
  - `${path}` URI path
  - `${basename}` file name
  - `${dirname}` parent path
  - `${extension}` normalized extension from mapping

Run it with `F1` -> `Extension Launcher`.

## Development

Install dependencies:

```bash
npm install
```

Build once:

```bash
npm run build
```

Watch mode:

```bash
npm run watch
```

Type checking:

```bash
npm run typecheck
```

Lint:

```bash
npm run lint
```

Unit tests:

```bash
npm run test
```

Unit tests (watch mode):

```bash
npm run test:watch
```

Run/debug:

- Press `F5` in VS Code to launch the Extension Development Host.
- Run the command: `Extension Launcher`.

Continuous Integration:

- GitHub Actions workflow at `.github/workflows/ci.yml` runs lint, typecheck, tests, and build on push and pull requests.

## Packaging and Publishing

Before first publish, update metadata in `package.json`:

- Replace `publisher` (`your-publisher-name`) with your real Marketplace publisher id.
- Keep `displayName`, `description`, and `keywords` aligned with what you want in search results.

Then sign in:

```bash
npx vsce login <publisher>
```

Create a VSIX package:

```bash
npm run package:vsix
```

Publish:

```bash
npm run publish:vsce
```
