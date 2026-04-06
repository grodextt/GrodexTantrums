const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(srcDir);

function toDashCase(str) {
  let res = str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  // fix specific edge cases
  res = res.replace('grid-3-x-3', 'grid-3x3');
  return res;
}

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  
  // Find import { A, B, C } from 'lucide-react'
  const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/;
  const importMatch = content.match(importRegex);
  if (!importMatch) return;
  
  // Remove lucide-react import
  content = content.replace(importMatch[0], '');
  
  // Extract icon names
  const iconNames = importMatch[1].split(',').map(s => {
    const parts = s.trim().split(/\s+as\s+/);
    if (parts.length === 2) {
      return { original: parts[0].trim(), alias: parts[1].trim() };
    } else if (parts[0]) {
      return { original: parts[0].trim(), alias: parts[0].trim() };
    }
    return null;
  }).filter(Boolean);
  
  // Replace components: <Settings ... /> -> <Icon icon="lucide:settings" ... />
  iconNames.forEach(({original, alias}) => {
     let dashCaseName = toDashCase(original);
     
     // Regex to match <Alias ... />
     const regexSelfClosing = new RegExp(`<${alias}(\\s+[^>]*)?\\/>`, 'g');
     content = content.replace(regexSelfClosing, (match, props) => {
       props = props || '';
       return `<Icon icon="lucide:${dashCaseName}"${props}/>`;
     });
     
     const regexOpen = new RegExp(`<${alias}(\\s+[^>]*)?>`, 'g');
     content = content.replace(regexOpen, (match, props) => {
       props = props || '';
       return `<Icon icon="lucide:${dashCaseName}"${props}>`;
     });
     
     const regexClose = new RegExp(`<\/${alias}>`, 'g');
     content = content.replace(regexClose, `</Icon>`);
     
     // Handle cases where the component is passed as a prop or rendered dynamically
     // e.g. icon: <Settings />
     // Already handled by regexOpen / selfClosing if they have brackets
     // But wait, what if it's used as a reference? `icon: Settings`
     // E.g. { icon: Settings } -> { icon: () => <Icon icon="lucide:xxx" /> }
     // Oh, this could be tricky. We can look for `Settings` as a word.
     // But let's check manually if there are cases like this.
  });
  
  // Add iconify import if not exists
  if (!content.includes("@iconify/react") && !content.includes("import { Icon }")) {
      // Find the last import
      // or just prepend
      content = "import { Icon } from '@iconify/react';\n" + content;
  } else if (content.includes("@iconify/react") && !content.includes("import { Icon } from '@iconify/react'")) {
    // If it imports something else from iconify, we need Icon. But it shouldn't happen.
  }

  // Remove leading empty lines
  content = content.replace(/^\s*\n/g, '');
  if (content.startsWith("import")) {
    content = content.replace(/^import \{ Icon \} from '@iconify\/react';\nimport \{ Icon \} from '@iconify\/react';\n/, "import { Icon } from '@iconify/react';\n");
  }
  
  fs.writeFileSync(file, content, 'utf-8');
});

console.log("Migration complete!");
