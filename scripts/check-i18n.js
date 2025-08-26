const fs = require('fs');
const path = require('path');

function walk(dir, extRegex, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((f) => {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full, extRegex, fileList);
    } else if (extRegex.test(full)) {
      fileList.push(full);
    }
  });
  return fileList;
}

function collectKeysFromCode(root) {
  const files = walk(root, /\.(ts|tsx)$/);
  const keySet = new Set();
  const re = /t\(\s*['\"]([a-zA-Z0-9_\.-]+)['\"]\s*(?:,|\))/g;
  files.forEach((f) => {
    const src = fs.readFileSync(f, 'utf8');
    let m;
    while ((m = re.exec(src))) keySet.add(m[1]);
  });
  return Array.from(keySet).sort();
}

function loadLocaleKeys(dir) {
  const files = fs.readdirSync(dir).filter((x) => x.endsWith('.json'));
  const localeMap = {};
  files.forEach((f) => {
    const full = path.join(dir, f);
    const name = path.basename(f, '.json');
    try {
      const data = JSON.parse(fs.readFileSync(full, 'utf8'));
      localeMap[name] = new Set(Object.keys(data));
    } catch (e) {
      console.error('Failed to parse', full, e.message);
      localeMap[name] = new Set();
    }
  });
  return localeMap;
}

const projectRoot = path.resolve(__dirname, '..');
const codeKeys = collectKeysFromCode(path.join(projectRoot, 'app'));
const locales = loadLocaleKeys(path.join(projectRoot, 'i18n'));

console.log('Found', codeKeys.length, "i18n keys used in code:\n", codeKeys.join(', '));

Object.keys(locales).forEach((loc) => {
  const missing = codeKeys.filter((k) => !locales[loc].has(k));
  if (missing.length === 0) {
    console.log(`\nLocale ${loc}: OK`);
  } else {
    console.log(`\nLocale ${loc}: missing ${missing.length} keys:\n`, missing.join(', '));
  }
});
