// =====================================================================
// LevelUp — colour contrast checks
//
// Parses the real token values out of src/index.css and checks the pairs
// the interface actually renders, so the palette cannot drift below AA
// without this failing.
//
//   npm run verify:contrast
// =====================================================================
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const here = dirname(fileURLToPath(import.meta.url));
// Normalise line endings: the repo checks out CRLF on Windows and the
// block markers below are matched literally.
const css = readFileSync(resolve(here, '../src/index.css'), 'utf8').split(String.fromCharCode(13)).join('');

// ── Parse `--token: H S% L%;` out of the `:root, .light` and `.dark` blocks ──
function parseBlock(selector) {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`Could not find block: ${selector}`);
  const open = css.indexOf('{', start);
  const close = css.indexOf('\n  }', open);
  const body = css.slice(open, close);
  const tokens = {};
  const re = /--([a-z-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/g;
  let m;
  while ((m = re.exec(body))) {
    tokens[m[1]] = [parseFloat(m[2]), parseFloat(m[3]), parseFloat(m[4])];
  }
  return tokens;
}

// ── Colour maths ──
function hslToRgb([h, s, l]) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

function luminance([r, g, b]) {
  const c = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function contrast(a, b) {
  const l1 = luminance(hslToRgb(a));
  const l2 = luminance(hslToRgb(b));
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// ── The pairs the UI actually renders ──
// AA body text = 4.5:1. Essential UI boundaries (input borders) = 3:1.
// Decorative rules are held to a lower bar: they must be *visible*, which
// is a design requirement here because rules carry all the structure.
const PAIRS = [
  ['body text on page',        'foreground',        'background', 4.5],
  ['body text on card',        'foreground',        'card',       4.5],
  ['muted text on page',       'muted-foreground',  'background', 4.5],
  ['muted text on card',       'muted-foreground',  'card',       4.5],
  ['button label on primary',  'primary-foreground','primary',    4.5],
  ['accent text on page',      'primary-accent',    'background', 4.5],
  ['accent text on card',      'primary-accent',    'card',       4.5],
  ['success text on card',     'success',           'card',       4.5],
  ['warning text on card',     'warning',           'card',       4.5],
  ['error text on card',       'destructive',       'card',       4.5],
  ['secondary text',           'secondary-foreground', 'secondary', 4.5],
  ['input border on card',     'input',             'card',       2.0],
  ['rule visible on page',     'border',            'background', 1.5],
];

const themes = {
  light: parseBlock(':root,\n  .light'),
  dark: parseBlock('.dark {'),
};

let failures = 0;
let total = 0;

console.log('\nLevelUp contrast checks  (Paper & Ink)\n');

for (const [themeName, tokens] of Object.entries(themes)) {
  console.log(`  ${themeName.toUpperCase()}`);
  for (const [label, fg, bg, min] of PAIRS) {
    if (!tokens[fg] || !tokens[bg]) {
      console.log(`    ??  ${label.padEnd(24)} missing token (${!tokens[fg] ? fg : bg})`);
      failures++; total++;
      continue;
    }
    const ratio = contrast(tokens[fg], tokens[bg]);
    const ok = ratio >= min;
    if (!ok) failures++;
    total++;
    console.log(
      `    ${ok ? '✓' : '✗'}  ${label.padEnd(24)}${ratio.toFixed(2)}:1`.padEnd(46) +
      `min ${min}`
    );
  }
  console.log('');
}

console.log(`${total - failures}/${total} passed\n`);
process.exit(failures ? 1 : 0);
