import { execFile } from 'node:child_process';
import type { CheckResult } from './session.js';

function run(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: 5000 }, (err, stdout) => {
      if (err) return reject(err);
      resolve(stdout.trim());
    });
  });
}

export async function checkNode(): Promise<CheckResult> {
  try {
    const version = await run('node', ['--version']);
    return { name: 'Node.js', found: true, version };
  } catch {
    return { name: 'Node.js', found: false };
  }
}

export async function checkGit(): Promise<CheckResult> {
  try {
    const version = await run('git', ['--version']);
    const match = version.match(/(\d+\.\d+\.\d+)/);
    return { name: 'Git', found: true, version: match?.[1] ?? version };
  } catch {
    return { name: 'Git', found: false };
  }
}

export async function runAllChecks(): Promise<CheckResult[]> {
  return Promise.all([checkNode(), checkGit()]);
}
