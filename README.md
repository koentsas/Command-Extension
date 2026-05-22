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

Configure mappings in your VS Code settings:

```json
"extensionLauncher.mappings": [
	{
		"title": "Open BCS with Example Command",
		"extension": ".bcs",
		"command": "vscode.open",
		"commandArgs": ["${uri}"]
	}
]
```

`commandArgs` is optional.

- If `commandArgs` is omitted, the selected file URI is passed automatically.
- If provided, you can use tokens inside string arguments:
  - `${uri}` full URI string
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

Run/debug:

- Press `F5` in VS Code to launch the Extension Development Host.
- Run the command: `Extension Launcher`.

## Packaging and Publishing

Set your publisher in `package.json` and sign in first:

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
