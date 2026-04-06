import net from 'node:net';

import { DASHBOARD_PORT_RANGE_START, DASHBOARD_PORT_RANGE_END } from '@shared/constants.js';

export async function selectAvailablePort(
  preferredPort?: number,
  rangeStart: number = DASHBOARD_PORT_RANGE_START,
  rangeEnd: number = DASHBOARD_PORT_RANGE_END,
): Promise<number> {
  if (preferredPort !== undefined) {
    const available = await isPortAvailable(preferredPort);
    if (available) return preferredPort;
    throw new Error(`Port ${preferredPort} is already in use.`);
  }

  for (let port = rangeStart; port <= rangeEnd; port++) {
    const available = await isPortAvailable(port);
    if (available) return port;
  }

  throw new Error(`No available port found in range ${rangeStart}-${rangeEnd}.`);
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}
