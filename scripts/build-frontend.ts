import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { mkdirSync, copyFileSync, rmSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'dist');
const assetsDir = path.join(outputDir, 'assets');

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(assetsDir, { recursive: true });

await build({
  entryPoints: [path.join(root, 'src/main.tsx')],
  bundle: true,
  format: 'esm',
  target: 'es2020',
  outfile: path.join(assetsDir, 'main.js'),
  sourcemap: true,
  jsx: 'automatic',
  loader: { '.css': 'empty' },
  alias: { '@': root },
});

execFileSync(path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'tailwindcss.cmd' : 'tailwindcss'), [
  '-i', path.join(root, 'src/index.css'),
  '-o', path.join(assetsDir, 'main.css'),
  '--minify',
], { stdio: 'inherit' });

const html = await (await import('node:fs/promises')).readFile(path.join(root, 'index.html'), 'utf8');
const productionHtml = html
  .replace(/\s*<script type="module" src="\/src\/main\.tsx"><\/script>/, '\n    <link rel="stylesheet" href="/assets/main.css" />\n    <script type="module" src="/assets/main.js"></script>');

await (await import('node:fs/promises')).writeFile(path.join(outputDir, 'index.html'), productionHtml);
console.log('Frontend compilado com esbuild e Tailwind CLI.');
