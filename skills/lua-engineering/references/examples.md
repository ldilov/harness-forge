# Examples

## Add a Neovim feature safely

1. split setup wiring from core behavior
2. keep keymaps and commands near startup code
3. test pure logic separately from editor state
4. validate with a real editor session or health check

## Fix an OpenResty bug

1. identify request phase and shared state use
2. confirm the APIs are nonblocking for that phase
3. add the smallest fix that preserves worker and request behavior
4. run the repo's integration or smoke path
