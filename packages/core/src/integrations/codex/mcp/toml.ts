import { existsSync, readFileSync, writeFileSync } from 'node:fs';

type TomlSection = {
  start: number;
  end: number;
  body: string;
};

function findTomlSection(content: string, serverName: string): TomlSection | null {
  const header = `[mcp_servers.${serverName}]`;
  const start = content.indexOf(header);
  if (start === -1) return null;

  const nextSection = content.indexOf('\n[', start + header.length);
  const end = nextSection === -1 ? content.length : nextSection;
  return { start, end, body: content.slice(start, end) };
}

export function removeTomlSection(configPath: string, serverName: string): void {
  if (!existsSync(configPath)) return;
  try {
    const content = readFileSync(configPath, 'utf-8');
    const section = findTomlSection(content, serverName);
    if (!section) return;

    const before = content.slice(0, section.start).replace(/\n+$/, '');
    const after = content.slice(section.end);
    const result = (before + after).trim();

    writeFileSync(configPath, result ? result + '\n' : '', 'utf-8');
  } catch {
    // Corrupt or unreadable config — server is effectively unregistered already
  }
}

export function ensureTomlSection(serverName: string, url: string, configPath: string): void {
  try {
    const content = existsSync(configPath) ? readFileSync(configPath, 'utf-8') : '';
    if (findTomlSection(content, serverName)) return;

    const section = `\n[mcp_servers.${serverName}]\nurl = "${url}"\n`;
    writeFileSync(configPath, content.trimEnd() + section, 'utf-8');
  } catch {
    // Config may not be writable; patchHttpHeaders will handle the fallout
  }
}

export function patchHttpHeaders(
  serverName: string,
  headers: Readonly<Record<string, string>>,
  configPath: string,
): void {
  if (Object.keys(headers).length === 0) return;

  try {
    let content = readFileSync(configPath, 'utf-8');
    const section = findTomlSection(content, serverName);
    if (!section) return;

    const entries = Object.entries(headers)
      .map(([k, v]) => `"${k}" = "${v}"`)
      .join(', ');
    const headerLine = `http_headers = { ${entries} }`;

    const existingMatch = section.body.match(/^http_headers\s*=.*$/m);
    if (existingMatch) {
      const lineStart = section.start + section.body.indexOf(existingMatch[0]);
      content =
        content.slice(0, lineStart) +
        headerLine +
        content.slice(lineStart + existingMatch[0].length);
    } else {
      const before = content.slice(0, section.end).trimEnd();
      const after = content.slice(section.end);
      content = before + '\n' + headerLine + '\n' + after;
    }

    writeFileSync(configPath, content, 'utf-8');
  } catch {
    // Config may not exist yet if `codex mcp add` failed; MCP still works without custom headers
  }
}
