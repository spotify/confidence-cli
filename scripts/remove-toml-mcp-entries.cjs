#!/usr/bin/env node
const fs = require('fs');
const path = process.argv[2];

let content = fs.readFileSync(path, 'utf-8');
const servers = ['confidence-flags', 'confidence-docs'];
let changed = false;
const removed = [];

for (const server of servers) {
  const header = `[mcp_servers.${server}]`;
  const idx = content.indexOf(header);
  if (idx === -1) continue;

  const nextSection = content.indexOf('\n[', idx + header.length);
  const before = content.slice(0, idx).replace(/\n+$/, '');
  const after = nextSection === -1 ? '' : content.slice(nextSection);
  content = (before + after).trim();
  changed = true;
  removed.push(server);
}

if (!changed) process.exit(0);

if (!content) {
  fs.unlinkSync(path);
  console.log('deleted:' + removed.join(','));
} else {
  fs.writeFileSync(path, content + '\n');
  console.log('cleaned:' + removed.join(','));
}
