const fs = require('fs');
const path = require('path');

// 1) 直接危险字面量
const literalDangerous = [
  'child_process.exec', 'child_process.spawn',
  'eval(', 'Function(', 'new Function',
  'process.exit', 'process.kill',
  'fs.writeFileSync', 'fs.unlink',
  'fs.writeFile', 'fs.appendFile', 'fs.rm', 'fs.rmdir',
  'process.binding', 'module.constructor',
  'import(',
];

// 2) 可疑内置/系统模块：插件不应直接 require 这些
const suspiciousModules = ['child_process', 'vm', 'worker_threads', 'os', 'net', 'dgram', 'cluster'];

const pluginsDir = path.join(__dirname, '../plugins');

// 把 'a' + 'b' / "a" + "b" 这类拼接合并，抵消最简单的绕过
function normalize(content) {
  return content
    .replace(/'([^']*)'\s*\+\s*'([^']*)'/g, '$1$2')
    .replace(/"([^"]*)"\s*\+\s*"([^"]*)"/g, '$1$2');
}

let failed = false;
for (const dir of fs.readdirSync(pluginsDir)) {
  if (dir === '_template') continue;
  const indexPath = path.join(pluginsDir, dir, 'index.js');
  if (!fs.existsSync(indexPath)) continue;

  const raw = fs.readFileSync(indexPath, 'utf8');
  const content = normalize(raw);
  let dirFailed = false;

  for (const pattern of literalDangerous) {
    if (content.includes(pattern)) {
      console.error(`🚨 SECURITY: Found "${pattern}" in ${dir}/index.js`);
      dirFailed = failed = true;
    }
  }

  // 静态 require('module') 提取（归一化后拼接也躲不掉）
  const requires = content.match(/require\(\s*['"`]([^'"`]+)['"`]\s*\)/g) || [];
  for (const r of requires) {
    const m = r.match(/require\(\s*['"`]([^'"`]+)['"`]\s*\)/);
    const mod = m ? m[1] : '';
    if (suspiciousModules.some(s => mod === s || mod.startsWith(s + '.'))) {
      console.error(`🚨 SECURITY: Suspicious require("${mod}") in ${dir}/index.js`);
      dirFailed = failed = true;
    }
  }

  // 动态 require(变量) 一律告警（无法静态判定加载了什么）
  if (/\brequire\(\s*[^(['"`]/ .test(content)) {
    console.error(`🚨 SECURITY: Dynamic require(...) in ${dir}/index.js`);
    dirFailed = failed = true;
  }

  if (!dirFailed) console.log(`✅ ${dir} passed security check`);
}

if (failed) process.exit(1);
console.log('All plugins passed security check');
