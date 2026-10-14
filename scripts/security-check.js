const fs = require('fs');
const path = require('path');

const dangerous = [
  'child_process.exec', 'child_process.spawn',
  'eval(', 'Function(',
  'process.exit', 'process.kill',
  'fs.writeFileSync', 'fs.unlink',
];

const pluginsDir = path.join(__dirname, '../plugins');
const dirs = fs.readdirSync(pluginsDir);

for (const dir of dirs) {
  if (dir === '_template') continue;
  const indexPath = path.join(pluginsDir, dir, 'index.js');
  if (!fs.existsSync(indexPath)) continue;
  
  const content = fs.readFileSync(indexPath, 'utf8');
  for (const pattern of dangerous) {
    if (content.includes(pattern)) {
      console.error(`🚨 SECURITY: Found "${pattern}" in ${dir}/index.js`);
      process.exit(1);
    }
  }
  console.log(`✅ ${dir} passed security check`);
}
console.log('All plugins passed security check');
