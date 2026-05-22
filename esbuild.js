const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');
const production = process.argv.includes('--production');

/** @type {import('esbuild').BuildOptions} */
const shared = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  format: 'cjs',
  minify: production,
  sourcemap: !production,
  sourcesContent: false,
  platform: 'node',
  outfile: 'dist/extension.js',
  external: ['vscode'],
  logLevel: 'info'
};

async function run() {
  if (watch) {
    const ctx = await esbuild.context(shared);
    await ctx.watch();
    console.log('[watch] esbuild watching for changes...');
    return;
  }

  await esbuild.build(shared);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
