const fs = require('fs');
const path = require('path');

const pluginsDir = path.join(__dirname, '../plugins');
const dirs = fs.readdirSync(pluginsDir).filter(d => d !== '_template');
const registry = {};

dirs.forEach(name => {
  const manifestPath = path.join(pluginsDir, name, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    registry[name] = {
      path: `plugins/${name}/`,
      ...manifest
    };
  }
});

fs.writeFileSync('registry.json', JSON.stringify(registry, null, 2));
console.log(`Generated registry with ${Object.keys(registry).length} plugins`);
