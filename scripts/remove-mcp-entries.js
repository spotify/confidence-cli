#!/usr/bin/env node
const fs = require('fs');

const path = process.argv[1];
const config = JSON.parse(fs.readFileSync(path, 'utf-8'));

if (!config.mcpServers || Object.keys(config.mcpServers).length === 0) {
  process.exit(0);
}

const names = Object.keys(config.mcpServers);
delete config.mcpServers;

if (Object.keys(config).length === 0) {
  fs.unlinkSync(path);
  console.log('deleted:' + names.join(','));
} else {
  fs.writeFileSync(path, JSON.stringify(config, null, 2) + '\n');
  console.log('cleaned:' + names.join(','));
}
