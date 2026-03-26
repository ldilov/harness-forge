# Debugging Playbook

## Plugin or script loads but behavior is wrong

Check module load order, returned tables, accidental globals, and whether the host loaded a stale compiled or cached artifact.

## Coroutine or async bug

Trace where a coroutine is created, resumed, and awaited by the host. Many Lua bugs come from assuming a scheduling model the host does not guarantee.

## Host-only failure

Look for editor, web-server, or game-loop lifecycle assumptions. A module that works in isolation can still fail because the host callback order differs from what the code expects.

## Native or FFI issue

Confirm runtime flavor, platform, and library availability before reasoning about Lua logic. Native-boundary bugs often look like ordinary Lua failures until you inspect the binding layer.
