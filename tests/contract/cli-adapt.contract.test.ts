import { describe, it, expect } from 'vitest';
import { Command } from 'commander';

import { registerAdaptCommands } from '@cli/commands/adapt.js';
import { registerLoopCommands } from '@cli/commands/loop-cmd.js';

describe('adapt CLI registration', () => {
  it('registers the adapt command', () => {
    const program = new Command();
    registerAdaptCommands(program);

    const adaptCmd = program.commands.find((c) => c.name() === 'adapt');
    expect(adaptCmd).toBeDefined();
    expect(adaptCmd!.description()).toContain('auto-tunings');
  });

  it('adapt command has --revert option', () => {
    const program = new Command();
    registerAdaptCommands(program);

    const adaptCmd = program.commands.find((c) => c.name() === 'adapt')!;
    const revertOpt = adaptCmd.options.find((o) => o.long === '--revert');
    expect(revertOpt).toBeDefined();
  });

  it('adapt command has --unlock option', () => {
    const program = new Command();
    registerAdaptCommands(program);

    const adaptCmd = program.commands.find((c) => c.name() === 'adapt')!;
    const unlockOpt = adaptCmd.options.find((o) => o.long === '--unlock');
    expect(unlockOpt).toBeDefined();
  });

  it('adapt command has --json option', () => {
    const program = new Command();
    registerAdaptCommands(program);

    const adaptCmd = program.commands.find((c) => c.name() === 'adapt')!;
    const jsonOpt = adaptCmd.options.find((o) => o.long === '--json');
    expect(jsonOpt).toBeDefined();
  });
});

describe('loop CLI registration', () => {
  it('registers the loop command', () => {
    const program = new Command();
    registerLoopCommands(program);

    const loopCmd = program.commands.find((c) => c.name() === 'loop');
    expect(loopCmd).toBeDefined();
    expect(loopCmd!.description()).toContain('Living Loop');
  });

  it('loop command has --json option', () => {
    const program = new Command();
    registerLoopCommands(program);

    const loopCmd = program.commands.find((c) => c.name() === 'loop')!;
    const jsonOpt = loopCmd.options.find((o) => o.long === '--json');
    expect(jsonOpt).toBeDefined();
  });

  it('loop command has --root option', () => {
    const program = new Command();
    registerLoopCommands(program);

    const loopCmd = program.commands.find((c) => c.name() === 'loop')!;
    const rootOpt = loopCmd.options.find((o) => o.long === '--root');
    expect(rootOpt).toBeDefined();
  });
});
