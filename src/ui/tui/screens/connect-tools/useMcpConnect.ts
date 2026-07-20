import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type McpServerName,
  type McpServerStatus,
  allServersConnected,
  getAvailableMcpServers,
  verifyMcpServer,
  loadMcpPreference,
  persistMcpPreference,
  MCP_SERVERS,
  getIntegration,
} from '@integrations/index.js';
import type { IdeId } from '@integrations/index.js';
import { ScreenId } from '@lib/session.js';
import { useLogger } from '../../hooks/useLog.js';
import { mcpDetected, mcpRegistered, mcpVerified } from './log-messages.js';
import { useSession, $session, store } from '../../store.js';
import { useInitialMcpDetection } from './useInitialMcpDetection.js';

export type McpPhase =
  'detecting' | 'already-connected' | 'ask-install' | 'connecting' | 'connected' | 'skipped';

export type McpConnectState = {
  phase: McpPhase;
  serverStatuses: Record<string, McpServerStatus>;
  available: ReturnType<typeof getAvailableMcpServers>;
  connectedNames: string[];
  connect: (value: string) => void;
  skip: () => void;
};

export function useMcpConnect(): McpConnectState {
  const session = useSession();
  const log = useLogger(ScreenId.ConnectTools);
  const ide = (session.ide ?? 'claude') as IdeId;
  const integration = getIntegration(ide);
  const initial = useInitialMcpDetection();
  const [phase, setPhase] = useState<McpPhase>(initial.phase);
  const [serverStatuses, setServerStatuses] = useState<Record<string, McpServerStatus>>({});
  const available = useMemo(() => getAvailableMcpServers(), []);

  const connectedNames = useMemo(
    () =>
      Object.entries(serverStatuses)
        .filter(([, status]) => status === 'connected')
        .map(([name]) => name),
    [serverStatuses],
  );

  useEffect(
    function syncConnectedMcps() {
      const current = $session.get().connectedMcps;
      const alreadyInSync =
        connectedNames.length === current.length &&
        connectedNames.every((n, i) => n === current[i]);
      if (alreadyInSync) return;

      store.setConnectedMcps(connectedNames);
    },
    [connectedNames],
  );

  function applyStatuses(updated: Record<string, McpServerStatus>) {
    setServerStatuses((prev) => {
      const nothingChanged = Object.entries(updated).every(([k, v]) => prev[k] === v);
      if (nothingChanged) return prev;

      const merged = { ...prev, ...updated };
      setPhase(allServersConnected(merged) ? 'connected' : 'ask-install');
      return merged;
    });
  }

  const registerAndVerify = useCallback(
    async function registerAndVerify(
      names: McpServerName[],
      projectDir: string,
      token?: string,
    ): Promise<Record<string, McpServerStatus>> {
      for (const name of names) {
        const server = MCP_SERVERS[name];
        try {
          await integration.connectMcpServer({
            serverName: name,
            serverUrl: server.url,
            serverType: server.type,
            serverHeaders: { ...server.headers },
            projectDir,
            accessToken: token,
          });
        } catch {
          // Registration failed — verification will catch this
        }
        log(mcpRegistered({ name, url: server.url, ide }));
      }

      const results = await Promise.all(
        names.map(async (name) => {
          const server = available.find((s) => s.name === name);
          const ok = await verifyMcpServer(name);
          log(mcpVerified(server?.url, ok));
          return [name, ok ? 'connected' : 'installed'] as const;
        }),
      );

      return Object.fromEntries(results);
    },
    [ide, integration, available, log],
  );

  useEffect(
    function detectAndAutoConnect() {
      if (session.dryRun) return;

      async function run() {
        const statuses = await integration.detectMcpStatuses(session.projectDir);

        for (const [name, status] of Object.entries(statuses)) {
          const server = available.find((s) => s.name === name);
          log(mcpDetected(server?.url ?? name, status));
        }
        setServerStatuses(statuses);

        const preference = loadMcpPreference();
        const allOk = allServersConnected(statuses);

        if (allOk && preference === 'connected') {
          refreshRegisteredMcps(session.projectDir);
          setPhase('already-connected');
          return;
        }

        if (preference !== 'connected') {
          setPhase('ask-install');
          return;
        }

        const token = $session.get().authState.token;
        if (!token) {
          setPhase('ask-install');
          return;
        }

        // Auto-reconnect only servers that were previously registered but lost their connection
        const needsReconnect = available
          .filter((s) => statuses[s.name as McpServerName] === 'installed')
          .map((s) => s.name as McpServerName);

        if (needsReconnect.length === 0) {
          setPhase('ask-install');
          return;
        }

        setPhase('connecting');
        const results = await registerAndVerify(needsReconnect, session.projectDir, token);
        const merged = { ...statuses, ...results };
        setServerStatuses(merged);

        setPhase(allServersConnected(merged) ? 'connected' : 'ask-install');
      }

      function refreshRegisteredMcps(projectDir: string) {
        const token = $session.get().authState.token;
        if (!token) return;

        for (const s of available) {
          const server = MCP_SERVERS[s.name as McpServerName];
          integration.refreshMcpAuth({
            serverName: s.name,
            serverUrl: server.url,
            serverType: server.type,
            serverHeaders: { ...server.headers },
            projectDir,
            accessToken: token,
          });
        }
      }

      run();
    },
    [session.dryRun, session.projectDir, integration, available, log, registerAndVerify],
  );

  function connect(value: string) {
    setPhase('connecting');
    const remaining = available
      .filter((s) => (serverStatuses[s.name] ?? 'not-installed') !== 'connected')
      .map((s) => s.name as McpServerName);
    const namesToConnect: McpServerName[] = value === 'all' ? remaining : [value as McpServerName];

    if ($session.get().dryRun) return connectDryRun(namesToConnect);
    connectReal(namesToConnect);
  }

  function connectDryRun(namesToConnect: McpServerName[]) {
    for (const name of namesToConnect) {
      const server = available.find((s) => s.name === name);
      log(mcpRegistered({ name, url: server?.url, ide, dryRun: true }));
    }
    setTimeout(() => {
      applyStatuses(Object.fromEntries(namesToConnect.map((n) => [n, 'connected' as const])));
    }, 1000);
  }

  async function connectReal(namesToConnect: McpServerName[]) {
    const s = $session.get();
    const results = await registerAndVerify(namesToConnect, s.projectDir, s.authState.token);
    applyStatuses(results);
    persistMcpPreference('connected');
  }

  function skip() {
    persistMcpPreference('skipped');
    setPhase('skipped');
  }

  return { phase, serverStatuses, available, connectedNames, connect, skip };
}
