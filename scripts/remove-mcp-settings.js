#!/usr/bin/env node
const fs = require('fs');
const path = process.argv[1];

const config = JSON.parse(fs.readFileSync(path, 'utf-8'));

let changed = false;
const allow = config.permissions?.allow;

if (Array.isArray(allow)) {
  const filtered = allow.filter((p) => !p.startsWith('mcp__'));
  if (filtered.length !== allow.length) {
    config.permissions.allow = filtered;
    if (filtered.length === 0) delete config.permissions.allow;
    if (Object.keys(config.permissions).length === 0) delete config.permissions;
    changed = true;
  }
}

if (Array.isArray(config.enabledMcpjsonServers) && config.enabledMcpjsonServers.length > 0) {
  delete config.enabledMcpjsonServers;
  changed = true;
}

if (!changed) {
  process.exit(0);
}

if (Object.keys(config).length === 0) {
  fs.unlinkSync(path);
  console.log('deleted');
} else {
  fs.writeFileSync(path, JSON.stringify(config, null, 2) + '\n');
  console.log('cleaned');
}
