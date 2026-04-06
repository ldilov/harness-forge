#!/usr/bin/env node
/**
 * Seed realistic demo events into .hforge/observability/events.json
 * so the dashboard has data to display.
 *
 * Usage: node scripts/dashboard/seed-demo-events.mjs [--root <path>]
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.argv.includes('--root')
  ? process.argv[process.argv.indexOf('--root') + 1]
  : process.cwd();

const eventsDir = path.join(root, '.hforge', 'observability');
const eventsFile = path.join(eventsDir, 'events.json');

fs.mkdirSync(eventsDir, { recursive: true });

function id() { return `bevt_${crypto.randomBytes(12).toString('hex')}`; }
function ts(minutesAgo) { return new Date(Date.now() - minutesAgo * 60000).toISOString(); }

const SESSION = 'sess_demo_' + Date.now().toString(36);

const events = [
  // Session start
  { eventId: id(), eventType: 'context.load.started', occurredAt: ts(30), schemaVersion: '1.0.0', runtimeSessionId: SESSION, payload: {} },
  { eventId: id(), eventType: 'context.load.completed', occurredAt: ts(29.5), schemaVersion: '1.0.0', runtimeSessionId: SESSION, payload: {} },
  { eventId: id(), eventType: 'runtime.startup.files.generated', occurredAt: ts(29), schemaVersion: '1.0.0', runtimeSessionId: SESSION, payload: {} },

  // Initial budget state — comfortable
  { eventId: id(), eventType: 'context.budget.warning', occurredAt: ts(25), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { budgetState: { estimatedTokens: 1200, hardCap: 4000 } } },

  // Subagent brief generated
  { eventId: id(), eventType: 'subagent.brief.generated', occurredAt: ts(24), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { objective: 'Review authentication middleware for security gaps', estimatedTokens: 380, responseProfile: 'brief', sourceStateType: 'live' } },
  { eventId: id(), eventType: 'subagent.run.started', occurredAt: ts(23.5), schemaVersion: '1.0.0', runtimeSessionId: SESSION, payload: {} },
  { eventId: id(), eventType: 'subagent.run.completed', occurredAt: ts(22), schemaVersion: '1.0.0', runtimeSessionId: SESSION, payload: {} },

  // Response profile selections
  { eventId: id(), eventType: 'response.profile.selected', occurredAt: ts(23), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { profile: 'brief', source: 'default', context: 'subagent' } },
  { eventId: id(), eventType: 'response.profile.selected', occurredAt: ts(21), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { profile: 'standard', source: 'default', context: 'top_level' } },
  { eventId: id(), eventType: 'response.profile.selected', occurredAt: ts(15), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { profile: 'deep', source: 'explicit_override', context: 'review_export' } },

  // Duplicate suppression
  { eventId: id(), eventType: 'context.duplicate.suppressed', occurredAt: ts(20), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { suppressionCounts: { total: 12, suppressed: 4 }, suppressedSources: [
      { path: '.agents/skills/code-review.md', type: 'bridge', reason: 'duplicate of runtime skill' },
      { path: 'AGENTS.md', type: 'wrapper', reason: 'content hash match with runtime context' },
      { path: '.agents/skills/testing.md', type: 'bridge', reason: 'superseded by runtime version' },
      { path: '.claude/settings.json', type: 'wrapper', reason: 'merged into runtime policy' },
    ] } },

  // Budget climbing — approaching warning
  { eventId: id(), eventType: 'context.budget.warning', occurredAt: ts(18), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { budgetState: { estimatedTokens: 2400, hardCap: 4000 } } },

  // History expansion requested and denied
  { eventId: id(), eventType: 'history.expansion.requested', occurredAt: ts(17), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { reason: 'Agent requested full conversation history for debugging' } },
  { eventId: id(), eventType: 'history.expansion.denied', occurredAt: ts(17), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { reason: 'Default policy: deny unless explicit_user_request override' } },

  // Context summary promoted
  { eventId: id(), eventType: 'context.summary.promoted', occurredAt: ts(16), schemaVersion: '1.0.0', runtimeSessionId: SESSION, payload: {} },
  { eventId: id(), eventType: 'context.delta.emitted', occurredAt: ts(16), schemaVersion: '1.0.0', runtimeSessionId: SESSION, payload: {} },

  // Budget exceeds warning — compaction triggered
  { eventId: id(), eventType: 'context.budget.warning', occurredAt: ts(14), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { budgetState: { estimatedTokens: 3200, hardCap: 4000 } } },
  { eventId: id(), eventType: 'context.compaction.triggered', occurredAt: ts(13.5), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { level: 'trim' } },
  { eventId: id(), eventType: 'context.compaction.completed', occurredAt: ts(13), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { tokensBeforeAfter: { before: 3200, after: 2400 }, level: 'trim' } },

  // Another subagent
  { eventId: id(), eventType: 'subagent.brief.generated', occurredAt: ts(12), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { objective: 'Analyze database query performance in user-service', estimatedTokens: 520, responseProfile: 'standard', sourceStateType: 'compacted' } },
  { eventId: id(), eventType: 'subagent.run.started', occurredAt: ts(11.5), schemaVersion: '1.0.0', runtimeSessionId: SESSION, payload: {} },
  { eventId: id(), eventType: 'subagent.brief.rewritten', occurredAt: ts(11), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { reason: 'Brief exceeded token budget, rewritten with tighter scope' } },
  { eventId: id(), eventType: 'subagent.run.completed', occurredAt: ts(10), schemaVersion: '1.0.0', runtimeSessionId: SESSION, payload: {} },

  // Artifact promotion
  { eventId: id(), eventType: 'artifact.pointer.promoted', occurredAt: ts(9), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { estimatedTokensSaved: 450, reference: '[See .hforge/runtime/session-summary.json]' } },
  { eventId: id(), eventType: 'artifact.pointer.promoted', occurredAt: ts(8), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { estimatedTokensSaved: 320, reference: '[See .hforge/runtime/active-context.json]' } },

  // Budget climbing again — higher compaction
  { eventId: id(), eventType: 'context.budget.warning', occurredAt: ts(7), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { budgetState: { estimatedTokens: 3500, hardCap: 4000 } } },
  { eventId: id(), eventType: 'context.compaction.triggered', occurredAt: ts(6.5), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { level: 'summarize' } },
  { eventId: id(), eventType: 'context.compaction.completed', occurredAt: ts(6), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { tokensBeforeAfter: { before: 3500, after: 1900 }, level: 'summarize' } },

  // More duplicate suppression
  { eventId: id(), eventType: 'context.duplicate.suppressed', occurredAt: ts(5), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { suppressionCounts: { total: 8, suppressed: 2 }, suppressedSources: [
      { path: 'memory.md', type: 'bridge', reason: 'content hash match with active-context.json' },
      { path: '.agents/skills/debug.md', type: 'bridge', reason: 'duplicate of runtime skill' },
    ] } },

  // Subagent brief rejected
  { eventId: id(), eventType: 'subagent.brief.generated', occurredAt: ts(4), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { objective: 'Full codebase security audit', estimatedTokens: 2800, responseProfile: 'deep', sourceStateType: 'live' } },
  { eventId: id(), eventType: 'subagent.brief.rejected', occurredAt: ts(3.5), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { reason: 'Brief token estimate (2800) exceeds subagent budget cap (1500)' } },

  // Memory rotation
  { eventId: id(), eventType: 'context.budget.exceeded', occurredAt: ts(3), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { budgetState: { estimatedTokens: 4200, hardCap: 4000 } } },
  { eventId: id(), eventType: 'memory.rotation.started', occurredAt: ts(2.5), schemaVersion: '1.0.0', runtimeSessionId: SESSION, payload: {} },
  { eventId: id(), eventType: 'memory.rotation.completed', occurredAt: ts(2), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { automatic: true } },

  // Post-rotation — budget back to normal
  { eventId: id(), eventType: 'context.budget.warning', occurredAt: ts(1.5), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { budgetState: { estimatedTokens: 1100, hardCap: 4000 } } },

  // Response profile override
  { eventId: id(), eventType: 'response.profile.overridden', occurredAt: ts(1), schemaVersion: '1.0.0', runtimeSessionId: SESSION,
    payload: { profile: 'deep', reason: 'User explicitly requested verbose output' } },

  // Recent context delta
  { eventId: id(), eventType: 'context.delta.emitted', occurredAt: ts(0.5), schemaVersion: '1.0.0', runtimeSessionId: SESSION, payload: {} },
];

// Write events
fs.writeFileSync(eventsFile, JSON.stringify(events, null, 2), 'utf8');

console.log(`Seeded ${events.length} demo events into ${eventsFile}`);
console.log(`Session: ${SESSION}`);
console.log(`\nEvent breakdown:`);

const counts = {};
for (const e of events) {
  counts[e.eventType] = (counts[e.eventType] || 0) + 1;
}
for (const [type, count] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${type}: ${count}`);
}

console.log(`\nRun "hforge dashboard" to see them in the dashboard.`);
