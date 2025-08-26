const fs = require('fs');
const path = require('path');

const metroServerPath = path.join(__dirname, '..', 'node_modules', 'metro', 'src', 'Server.js');

if (!fs.existsSync(metroServerPath)) {
  console.log('Metro Server.js not found at', metroServerPath);
  process.exit(0);
}

let content = fs.readFileSync(metroServerPath, 'utf8');

const marker = "const fileAbsolute = path.resolve(this._config.projectRoot, file ?? \"\");";
if (content.includes("Skip invalid or synthetic filenames")) {
  console.log('Metro fix already applied');
  process.exit(0);
}

// Find the original block to replace. We'll look for the readFileSync try block near codeFrameColumns
const origRegex = /\n\s*const fileAbsolute = path\.resolve\(this._config\.projectRoot, file \?\? \"\"\);[\s\S]*?console\.error\(error\);\n\s*\}/;
const replacement = `\n        // Skip invalid or synthetic filenames like '<anonymous>' which are\n        // not present on disk. Also skip files that don't exist to avoid\n        // throwing ENOENT when attempting to read them for code frames.\n        if (typeof file !== 'string' || file.startsWith('<')) {\n          continue;\n        }\n\n        const fileAbsolute = path.resolve(this._config.projectRoot, file);\n        try {\n          if (!fs.existsSync(fileAbsolute)) {\n            // File doesn't exist in the project; skip to next frame.\n            continue;\n          }\n\n          const source = fs.readFileSync(fileAbsolute, 'utf8');\n          return {\n            content: codeFrameColumns(\n              source,\n              {\n                start: {\n                  column: column + 1,\n                  line: lineNumber,\n                },\n              },\n              {\n                forceColor: true,\n              }\n            ),\n            location: {\n              row: lineNumber,\n              column,\n            },\n            fileName: file,\n          };\n        } catch (error) {\n          console.error(error);\n        }`;

if (!origRegex.test(content)) {
  console.warn('Could not find the original block to patch in Metro Server.js; aborting.');
  process.exit(0);
}

content = content.replace(origRegex, replacement);
fs.writeFileSync(metroServerPath, content, 'utf8');
console.log('Applied Metro Server.js ENOENT guard.');
process.exit(0);
