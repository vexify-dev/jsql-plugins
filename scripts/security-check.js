const fs = require('fs');
const path = require('path');

// 1) 危险字面量（词法归一化后按正则匹配，杜绝动态拼接/成员访问绕过）
const dangerPatterns = [
  [/child_process\.exec\b/, 'child_process.exec'],
  [/child_process\.spawn\b/, 'child_process.spawn'],
  [/\beval\s*\(/, 'eval('],
  [/\bFunction\s*\(/, 'Function('],
  [/\bnew\s+Function\b/, 'new Function'],
  [/\bprocess\.exit\b/, 'process.exit'],
  [/\bprocess\.kill\b/, 'process.kill'],
  [/\bfs\.writeFile(?:Sync)?\b/, 'fs.writeFile'],
  [/\bfs\.appendFile(?:Sync)?\b/, 'fs.appendFile'],
  [/\bfs\.unlink(?:Sync)?\b/, 'fs.unlink'],
  [/\bfs\.rm(?:Sync)?\b/, 'fs.rm'],
  [/\bfs\.rmdir(?:Sync)?\b/, 'fs.rmdir'],
  [/\bprocess\.binding\b/, 'process.binding'],
  [/\bmodule\.constructor\b/, 'module.constructor'],
  [/\bimport\s*\(/, 'import('],
];

// 2) 可疑内置/系统模块：插件不应直接 require 这些
const suspiciousModules = ['child_process', 'vm', 'worker_threads', 'os', 'net', 'dgram', 'cluster'];

// 3) require 别名 / 间接加载（没有 require(...) 字面量调用也能拿到模块）
const indirectRequire = [
  [/(?:const|let|var)\s+\w+\s*=\s*require\b(?!\s*\()/, 'require aliased'],
  [/\bmodule\.require\b/, 'module.require'],
  [/\bprocess\.mainModule\b/, 'process.mainModule'],
  [/\bglobal\.require\b/, 'global.require'],
  [/\bglobalThis\.require\b/, 'globalThis.require'],
  [/\bmodule\.constructor\._load\b/, 'module.constructor._load'],
];

const pluginsDir = path.join(__dirname, '../plugins');

// 合并三种引号字符串拼接并保留引号，循环直到稳定（处理 'a'+'b'+'c' 链）
function foldStringConcat(content) {
  const res = [
    [/'([^']*)'\s*\+\s*'([^']*)'/g, "'$1$2'"],
    [/"([^"]*)"\s*\+\s*"([^"]*)"/g, '"$1$2"'],
    [/`([^`]*)`\s*\+\s*`([^`]*)`/g, '`$1$2`'],
  ];
  let prev;
  let s = content;
  do {
    prev = s;
    for (const [re, rep] of res) s = s.replace(re, rep);
  } while (s !== prev);
  return s;
}

// 成员访问归一化：['x'] / ["x"] / [`x`] → .x（配合危险字面量检测）
function foldMember(content) {
  return content
    .replace(/\[\s*'([^']*)'\s*\]/g, '.$1')
    .replace(/\[\s*"([^"]*)"\s*\]/g, '.$1')
    .replace(/\[\s*`([^`]*)`\s*\]/g, '.$1');
}

function normalize(content) {
  return foldMember(foldStringConcat(content));
}

// require 参数是否为「纯字符串字面量」（无拼接、无 ${} 插值）
function isStaticLiteral(arg) {
  const lit =
    /^'[^']*'$/.test(arg) ||
    /^"[^"]*"$/.test(arg) ||
    /^`[^`]*`$/.test(arg);
  return lit && !arg.includes('${');
}

/**
 * 检测单个插件源码，返回违规描述数组（空数组 = 通过）。
 * 供 CLI 与单测/CI 复用。
 */
function checkSource(src) {
  const content = normalize(src);
  const findings = [];

  // 危险字面量（归一化后正则匹配）
  for (const [re, label] of dangerPatterns) {
    if (re.test(content)) findings.push(label);
  }

  // 静态 require('module') 提取（归一化后拼接也躲不掉）
  const requires = content.match(/require\(\s*['"`]([^'"`]+)['"`]\s*\)/g) || [];
  for (const r of requires) {
    const m = r.match(/require\(\s*['"`]([^'"`]+)['"`]\s*\)/);
    const mod = m ? m[1] : '';
    if (suspiciousModules.some(s => mod === s || mod.startsWith(s + '.'))) {
      findings.push(`require("${mod}")`);
    }
  }

  // 动态 require：参数不是纯字符串字面量（变量 / 表达式 / 模板插值 / 数组 join）一律告警
  const dynRe = /\brequire\(\s*([^)]*)\)/g;
  let dm;
  while ((dm = dynRe.exec(content)) !== null) {
    const arg = dm[1].trim();
    if (!isStaticLiteral(arg)) {
      findings.push('Dynamic require(...)');
      break;
    }
  }

  // require 别名 / 间接加载
  for (const [re, label] of indirectRequire) {
    if (re.test(content)) findings.push(label);
  }

  return findings;
}

// CLI：扫描 plugins/ 下所有插件
if (require.main === module) {
  let failed = false;
  for (const dir of fs.readdirSync(pluginsDir)) {
    if (dir === '_template') continue;
    const indexPath = path.join(pluginsDir, dir, 'index.js');
    if (!fs.existsSync(indexPath)) continue;
    const findings = checkSource(fs.readFileSync(indexPath, 'utf8'));
    if (findings.length) {
      for (const f of findings) console.error(`🚨 SECURITY: ${f} in ${dir}/index.js`);
      failed = true;
    } else {
      console.log(`✅ ${dir} passed security check`);
    }
  }
  if (failed) process.exit(1);
  console.log('All plugins passed security check');
}

module.exports = { checkSource, normalize, dangerPatterns, suspiciousModules, indirectRequire };
