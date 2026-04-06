import { describe, it, expect } from 'vitest';
import net from 'node:net';
import { selectAvailablePort } from '../../src/application/dashboard/port-selector.js';

describe('selectAvailablePort', () => {
  it('returns a port in the default range when no preference is given', async () => {
    const port = await selectAvailablePort();
    expect(port).toBeGreaterThanOrEqual(4580);
    expect(port).toBeLessThanOrEqual(4599);
  });

  it('returns the preferred port when available', async () => {
    const port = await selectAvailablePort(4590);
    expect(port).toBe(4590);
  });

  it('throws when the preferred port is occupied', async () => {
    const blocker = net.createServer();
    const blockerPort = 4595;

    await new Promise<void>((resolve) => {
      blocker.listen(blockerPort, '127.0.0.1', () => resolve());
    });

    try {
      await expect(selectAvailablePort(blockerPort)).rejects.toThrow(
        `Port ${blockerPort} is already in use`,
      );
    } finally {
      await new Promise<void>((resolve) => blocker.close(() => resolve()));
    }
  });

  it('skips occupied ports and returns the next available one', async () => {
    const blockers: net.Server[] = [];
    const rangeStart = 14580;

    // Block first 3 ports in a high range to avoid conflicts
    for (let i = 0; i < 3; i++) {
      const server = net.createServer();
      await new Promise<void>((resolve) => {
        server.listen(rangeStart + i, '127.0.0.1', () => resolve());
      });
      blockers.push(server);
    }

    try {
      const port = await selectAvailablePort(undefined, rangeStart, rangeStart + 5);
      expect(port).toBe(rangeStart + 3);
    } finally {
      for (const server of blockers) {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    }
  });

  it('throws when all ports in range are occupied', async () => {
    const blockers: net.Server[] = [];
    const rangeStart = 4596;
    const rangeEnd = 4597;

    for (let port = rangeStart; port <= rangeEnd; port++) {
      const server = net.createServer();
      await new Promise<void>((resolve) => {
        server.listen(port, '127.0.0.1', () => resolve());
      });
      blockers.push(server);
    }

    try {
      await expect(
        selectAvailablePort(undefined, rangeStart, rangeEnd),
      ).rejects.toThrow('No available port found');
    } finally {
      for (const server of blockers) {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    }
  });
});
