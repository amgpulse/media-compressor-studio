import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'node_modules', '@ffmpeg', 'core', 'dist', 'esm');
const outDir = join(root, 'public', 'ffmpeg');

const files = ['ffmpeg-core.js', 'ffmpeg-core.wasm'];

if (!existsSync(srcDir)) {
  throw new Error('[ffmpeg-core] node_modules/@ffmpeg/core/dist/esm not found. Install dependencies before building.');
}

mkdirSync(outDir, { recursive: true });

for (const file of files) {
  const src = join(srcDir, file);
  const dest = join(outDir, file);
  if (!existsSync(src)) {
    throw new Error(`[ffmpeg-core] Required file not found: ${src}`);
  }
  if (existsSync(dest) && statSync(dest).mtimeMs >= statSync(src).mtimeMs) continue;
  copyFileSync(src, dest);
  console.log(`[ffmpeg-core] copied ${file} -> public/ffmpeg/`);
}
