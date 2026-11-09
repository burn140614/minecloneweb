import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'dist');
const OUT_FILE = path.join(OUT_DIR, 'Prerelease 0.01.html');

function read(p) { return fs.readFileSync(p, 'utf8'); }

const index = read(path.join(ROOT, 'index.html'));
const worldSrc = read(path.join(ROOT, 'src/world.js'));
const inputSrc = read(path.join(ROOT, 'src/input.js'));

const moduleStart = index.indexOf('<script type="module">');
const moduleEnd = index.indexOf('</script>', moduleStart);
const moduleInner = index.slice(moduleStart + '<script type="module">'.length, moduleEnd);

// Remove the local ./src/ imports; we inline those sources instead.
let cleaned = moduleInner
  .replace(/^import \{[^}]*\} from '\.\/src\/world\.js';$/m, '')
  .replace(/^import \{[^}]*\} from '\.\/src\/input\.js';$/m, '')
  .trim();

const inlineModule = `<script type="module">
import * as THREE from 'https://esm.sh/three@0.166.1';
import { PointerLockControls } from 'https://esm.sh/three@0.166.1/examples/jsm/controls/PointerLockControls.js';

${worldSrc}

${inputSrc}

${cleaned}
</script>`;

let html = index.slice(0, moduleStart) + inlineModule + index.slice(moduleEnd);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, html);
console.log('Built:', OUT_FILE);