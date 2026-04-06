import path from 'node:path';
import { Command } from 'commander';

import { DEFAULT_WORKSPACE_ROOT, PACKAGE_ROOT } from '../../shared/index.js';
import { selectAvailablePort } from '../../application/dashboard/port-selector.js';
import { DashboardServer } from '../../application/dashboard/dashboard-server.js';

export function registerDashboardCommands(program: Command): void {
  program
    .command('dashboard')
    .description('Launch the real-time observability dashboard in the browser.')
    .option('--root <root>', 'workspace root', DEFAULT_WORKSPACE_ROOT)
    .option('--port <port>', 'specific port to use', undefined)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);

      const preferredPort = options.port !== undefined ? Number(options.port) : undefined;
      const port = await selectAvailablePort(preferredPort);

      const packageJson = await import('node:fs/promises').then(
        (fs) => fs.readFile(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'),
      ).then((content) => JSON.parse(content) as { version: string });

      const server = new DashboardServer({
        workspaceRoot,
        port,
        version: packageJson.version,
        sessionId: `dash_${Date.now().toString(36)}`,
      });

      await server.start();
      process.stdout.write(`Harness dashboard running at ${server.address}\n`);
      process.stdout.write(`Press Ctrl+C to stop.\n`);

      try {
        const { exec } = await import('node:child_process');
        const openCmd = process.platform === 'win32'
          ? `start ${server.address}`
          : process.platform === 'darwin'
            ? `open ${server.address}`
            : `xdg-open ${server.address}`;
        exec(openCmd);
      } catch {
        // Opening browser is best-effort
      }

      const shutdown = async () => {
        process.stdout.write('\nDashboard server stopped.\n');
        await server.stop();
        process.exit(0);
      };

      process.on('SIGINT', () => void shutdown());
      process.on('SIGTERM', () => void shutdown());

      // Keep process alive
      await new Promise(() => {});
    });
}
