import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'dist');
const VERSION = '0.04';
const OUT_FILE = path.join(OUT_DIR, `Prerelease ${VERSION}.html`);

function read(p) { return fs.readFileSync(p, 'utf8'); }

const index = read(path.join(ROOT, 'index.html'));
let worldSrc = read(path.join(ROOT, 'src/world.js'));
const inputSrc = read(path.join(ROOT, 'src/input.js'));

// Three.js is already imported at the top of the inlined module below,
// so strip the duplicate import from the inlined world source.
worldSrc = worldSrc.replace(/^\s*import \* as THREE from 'three';\s*\n?/m, '');

const moduleStart = index.indexOf('<script type="module">');
const moduleEnd = index.indexOf('</script>', moduleStart);
const moduleInner = index.slice(moduleStart + '<script type="module">'.length, moduleEnd);

// Remove the local ./src/ imports; we inline those sources instead.
// Allow leading whitespace before 'import'.
let cleaned = moduleInner
  .replace(/^\s*import \{[^}]*\} from '\.\/src\/world\.js';$/m, '')
  .replace(/^\s*import \{[^}]*\} from '\.\/src\/input\.js';$/m, '')
  // Three.js and PointerLockControls are already imported from CDN at the top
  // of the inlined module, so strip the duplicate declarations from the original module body.
  .replace(/^\s*import \* as THREE from 'three';\s*\n?/m, '')
  .replace(/^\s*import \{ PointerLockControls \} from 'three\/addons\/controls\/PointerLockControls\.js';\s*\n?/m, '')
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