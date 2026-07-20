import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { MCP_SERVERS } from '../mcp/servers.js';
import { PLUGIN_SKILLS, hasConfidenceServers, installSkills } from '../shared.js';
import { globalConfigPath, projectConfigPath, skillsDir } from './paths.js';

export function detectPlugins(projectDir: string): boolean {
  return hasMcpServers(projectDir) || hasSkillFiles(projectDir);
}

export async function installPlugins(projectDir: string): Promise<void> {
  await Promise.all([installMcpConfig(projectDir), installSkills(skillsDir(projectDir))]);
}

function hasMcpServers(projectDir: string): boolean {
  const paths = [globalConfigPath(), projectConfigPath(projectDir)];
  return paths.some((configPath) => {
    if (!existsSync(configPath)) return false;
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf-8')) as {
        mcpServers?: Record<string, unknown>;
      };
      return !!config.mcpServers && hasConfidenceServers(config.mcpServers);
    } catch {
      return false;
    }
  });
}

function hasSkillFiles(projectDir: string): boolean {
  const dir = skillsDir(projectDir);
  return PLUGIN_SKILLS.some((name) => existsSync(join(dir, name, 'SKILL.md')));
}

async function installMcpConfig(projectDir: string): Promise<void> {
  const configPath = projectConfigPath(projectDir);
  const dir = join(configPath, '..');
  await mkdir(dir, { recursive: true });

  let existing: { mcpServers?: Record<string, unknown> } = {};
  try {
    existing = JSON.parse(await readFile(configPath, 'utf-8')) as typeof existing;
  } catch {
    // overwrite if missing or corrupt
  }

  const mcpServers = { ...(existing.mcpServers ?? {}), ...MCP_SERVERS };
  const output = { ...existing, mcpServers };
  await writeFile(configPath, JSON.stringify(output, null, 2) + '\n', 'utf-8');
}
