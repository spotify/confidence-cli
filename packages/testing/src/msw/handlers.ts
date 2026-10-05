import { authHandlers } from './handlers/auth.js';
import { mcpHandlers } from './handlers/mcp.js';
import { telemetryHandlers } from './handlers/telemetry.js';
import { skillsHandlers } from './handlers/skills.js';
import { eventsHandlers } from './handlers/events.js';

export const handlers = [
  ...authHandlers,
  ...mcpHandlers,
  ...telemetryHandlers,
  ...skillsHandlers,
  ...eventsHandlers,
];
