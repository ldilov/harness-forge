<p align="center">
  <img src="https://img.shields.io/badge/%F0%9F%94%A8_harness--forge-v1.4.0-6C3FC5?style=for-the-badge" alt="version" />
</p>

<h1 align="center">🔨 Harness Forge</h1>

<p align="center">
  <strong>Make AI coding agents actually useful in your repository.</strong>
  <br />
  One command to set up Codex, Claude Code, or both &mdash; with the right context, skills, and workflows for your codebase.
</p>

<p align="center">
  <a href="https://github.com/ldilov/harness-forge/actions/workflows/ci.yml">
    <img alt="Build" src="https://img.shields.io/github/actions/workflow/status/ldilov/harness-forge/ci.yml?branch=main&style=for-the-badge&logo=githubactions&label=build&color=2ea44f" />
  </a>
  <a href="https://www.npmjs.com/package/@harness-forge/cli">
    <img alt="npm" src="https://img.shields.io/npm/v/@harness-forge/cli?style=for-the-badge&logo=npm&color=CB3837" />
  </a>
  <a href="https://www.npmjs.com/package/@harness-forge/cli">
    <img alt="downloads" src="https://img.shields.io/npm/dm/@harness-forge/cli?style=for-the-badge&logo=npm&label=downloads&color=0070f3" />
  </a>
  <a href="https://www.npmjs.com/package/@harness-forge/cli">
    <img alt="downloads 18m" src="https://img.shields.io/npm/d18m/@harness-forge/cli?style=for-the-badge&logo=npm&label=downloads%2F18m&color=0070f3" />
  </a>
</p>
<p align="center">
  <a href="https://github.com/ldilov/harness-forge/stargazers">
    <img alt="stars" src="https://img.shields.io/github/stars/ldilov/harness-forge?style=for-the-badge&logo=github&color=f5c518" />
  </a>
  <a href="https://github.com/ldilov/harness-forge/network/members">
    <img alt="forks" src="https://img.shields.io/github/forks/ldilov/harness-forge?style=for-the-badge&logo=github&color=8B5CF6" />
  </a>
  <a href="https://github.com/ldilov/harness-forge/issues">
    <img alt="issues" src="https://img.shields.io/github/issues/ldilov/harness-forge?style=for-the-badge&logo=github&color=f97316" />
  </a>
  <a href="./LICENSE">
    <img alt="license" src="https://img.shields.io/badge/license-GPL--3.0-EF4444?style=for-the-badge" />
  </a>
  <img alt="node" src="https://img.shields.io/badge/node-22+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
</p>

<p align="center">
  <a href="#-get-started-in-60-seconds">🚀 Get Started</a> &bull;
  <a href="#-what-does-it-do">✨ What It Does</a> &bull;
  <a href="#-everyday-commands">⌨️ Commands</a> &bull;
  <a href="#-real-world-scenarios">💡 Scenarios</a> &bull;
  <a href="#-updating">🔄 Updating</a> &bull;
  <a href="#-supported-targets">🎯 Targets</a> &bull;
  <a href="#-faq">❓ FAQ</a>
</p>

---

## 📈 Project Activity

<p align="center">
  <a href="https://star-history.com/#ldilov/harness-forge&Date">
    <img src="https://api.star-history.com/svg?repos=ldilov/harness-forge&type=Date" alt="Star History Chart" width="700" />
  </a>
</p>

---

## 💡 What is Harness Forge?

Harness Forge turns any repository into a well-equipped workspace for AI coding agents like **Codex** and **Claude Code**.

Think of it as a setup tool that:

- 🔍 **Scans** your repo and figures out what languages, frameworks, and tools you use
- 🧠 **Recommends** the right configuration for your AI agent
- 📦 **Installs** skills, knowledge packs, and workflows that make the agent more effective
- 🔧 **Maintains** everything organized and easy to update

| | Without Harness Forge | With Harness Forge |
|---|---|---|
| 🧠 **Context** | Agent guesses at project structure | Agent knows your languages, frameworks, boundaries |
| 🔧 **Skills** | Generic, one-size-fits-all | Tailored to your stack and workflow |
| 📋 **Workflow** | Ad hoc, inconsistent | Structured, repeatable, validated |
| 🔄 **Continuity** | Starts from scratch each session | Persistent runtime state across sessions |
| 🎯 **Targeting** | Same behavior for all tools | Codex, Claude Code, Cursor tuned separately |

---

<p align="center">
  <img src="https://img.shields.io/badge/🎯_targets-4-6C3FC5?style=for-the-badge" alt="4 targets" />
  <img src="https://img.shields.io/badge/🌐_languages-14-0070f3?style=for-the-badge" alt="14 languages" />
  <img src="https://img.shields.io/badge/🏗️_frameworks-12-2ea44f?style=for-the-badge" alt="12 frameworks" />
  <img src="https://img.shields.io/badge/🛠️_skills-45+-f97316?style=for-the-badge" alt="45+ skills" />
  <img src="https://img.shields.io/badge/📊_commands-50+-EF4444?style=for-the-badge" alt="50+ commands" />
</p>

---

## 🚀 Get Started in 60 Seconds

### Install and set up your repo

```bash
npx @harness-forge/cli
```

That's it. The CLI walks you through:

1. Which AI targets to set up (Codex, Claude Code, or both)
2. How deep to go (`quick`, `recommended`, or `advanced`)
3. Which optional features to include
4. A preview of exactly what files will be created

> **Tip:** Already know what you want? Use the one-liner:
> ```bash
> npx @harness-forge/cli init --root . --agent codex --setup-profile recommended --yes
> ```

### Make `hforge` available everywhere

```bash
npx @harness-forge/cli shell setup --yes
```

Now you can use `hforge` directly instead of `npx @harness-forge/cli`.

### Check that everything is healthy

```bash
hforge doctor --root . --json
```

---

## ✨ What Does It Do?

### 🔍 It understands your repo

```bash
hforge recommend . --json        # What setup makes sense for this repo?
hforge cartograph . --json       # Map the repo structure
hforge scan . --json             # Detect languages, frameworks, tools
```

Harness Forge scans your codebase and recommends the right targets, profiles, and skill packs &mdash; with evidence for each recommendation.

### 🧩 It equips your AI agent

After setup, your repo contains:

| What gets created | What it does |
|---|---|
| `AGENTS.md` | Entry point that tells the AI agent how your workspace is organized |
| `.agents/skills/` | Skills the agent can discover and use (code review, testing, debugging, etc.) |
| `.hforge/` | Hidden runtime with knowledge packs, rules, templates, and workspace state |
| `.codex/` or `.claude/` | Target-specific configuration for your chosen AI agent |

### 🛡️ It keeps things healthy over time

```bash
hforge status --root . --json     # What is installed?
hforge refresh --root . --json    # Regenerate runtime after changes
hforge review --root . --json     # Health check and readiness review
hforge next --root .              # What should I do next in this workspace?
```

---

## ⌨️ Everyday Commands

### 📥 Setup

| What you want to do | Command |
|---|---|
| Set up a new repo (guided) | `npx @harness-forge/cli` |
| Set up a new repo (one-liner) | `hforge init --root . --agent codex --setup-profile recommended --yes` |
| Auto-detect and bootstrap | `hforge bootstrap --root . --yes` |
| Preview without writing files | `hforge init --root . --agent codex --dry-run` |
| Enable `hforge` on your PATH | `hforge shell setup --yes` |

### 🔄 Daily use

| What you want to do | Command |
|---|---|
| What should I do next? | `hforge next --root .` |
| Check workspace health | `hforge doctor --root . --json` |
| Refresh the runtime | `hforge refresh --root . --json` |
| Review install state | `hforge status --root . --json` |
| Compare Codex vs Claude Code | `hforge target compare codex claude-code` |

### 🔧 Maintenance

| What you want to do | Command |
|---|---|
| Update Harness Forge in place | `hforge update --root . --yes` |
| Export runtime for handoff | `hforge export --root . --json` |
| Audit install integrity | `hforge audit --root . --json` |
| Check what drifted | `hforge diff-install --root . --json` |

---

## 💡 Real-World Scenarios

### 📂 Scenario 1: "I just cloned a repo and want AI help"

```bash
cd my-project
npx @harness-forge/cli
# Follow the guided setup
# Your AI agent now has full context about this repo
```

### 🤝 Scenario 2: "I use both Codex and Claude Code"

```bash
hforge init --root . --agent codex --agent claude-code --setup-profile recommended --yes
```

Both agents share the same hidden runtime (`.hforge/`) but get their own configuration bridges. Run `hforge target compare codex claude-code` to see the differences.

### 🔙 Scenario 3: "I come back to a repo after a while"

```bash
hforge next --root .
# Harness Forge tells you the most useful action right now
# Usually: refresh the runtime, run a health check, or review stale artifacts
```

### 👥 Scenario 4: "I want to standardize AI setup across my team's repos"

```bash
# Same command in every repo, same result
hforge init --root . --agent codex --setup-profile recommended --yes
hforge doctor --root . --json   # Verify it's healthy
hforge export --root . --json   # Share the runtime state
```

### 🧬 Scenario 5: "A task is really hard and needs structured investigation"

```bash
hforge recursive plan "investigate the billing retry flow" --task-id TASK-001 --json
hforge recursive capabilities --root . --json
```

Or let your AI agent decide when to escalate:

```
/hforge-recursive-investigate investigate the billing retry flow across API and worker boundaries
```

---

## 🔄 Updating

### Update Harness Forge to the latest version

```bash
hforge update --root . --yes
```

This downloads the latest published version and refreshes all managed surfaces while **keeping your workspace state** (task artifacts, decision records, recursive sessions, and observability data).

### Preview what an update would change

```bash
hforge update --root . --dry-run --yes
```

### Update globally

```bash
npm install -g @harness-forge/cli@latest
```

---

## 🎯 Supported Targets

| Target | Support Level | Best for |
|---|---|---|
| **Codex** | Full | Default choice &mdash; full install, maintenance, and runtime support |
| **Claude Code** | Full | When you need native hooks and plugin support |
| **Cursor** | Partial | Docs and manifests work; runtime features are limited |
| **OpenCode** | Partial | Docs and manifests work; runtime features are limited |

### ⚖️ Codex vs Claude Code

Both are first-class targets. The main difference is **hook support**:

| | Codex | Claude Code |
|---|---|---|
| Runtime | ✅ Full | ✅ Full |
| Maintenance | ✅ Full | ✅ Full |
| Hooks | 📄 Documentation-driven | ✅ Native |
| Plugins | 📄 Manual wiring | ✅ Native |
| Shared `.hforge/` | ✅ Yes | ✅ Yes |

Use both together when your team works with multiple tools. They share the same `.hforge/` runtime.

```bash
hforge target compare codex claude-code        # See all differences
hforge target compare codex claude-code --json  # Machine-readable comparison
```

---

## 📦 What's Included

### 🌐 Language packs (14 languages)

TypeScript, Python, Java, Go, Kotlin, Rust, C++, .NET, PHP, Perl, Swift, Shell, Lua, PowerShell

### 🏗️ Framework packs (12 frameworks)

React, Next.js, Vite, Express, FastAPI, Django, ASP.NET Core, Spring Boot, Laravel, Symfony, Gin, Ktor

### 🛠️ Skills (45+ packaged skills)

Language engineering, workflow orchestration, operational helpers, and specialized skills like incident triage, dependency upgrades, API contract review, database migration review, and release readiness.

---

## ⚙️ How It Works

```
Your Repo
  |
  |-- npx @harness-forge/cli
  |
  |-- Scans repo (languages, frameworks, targets)
  |-- Recommends setup (targets, profile, packs)
  |-- Installs runtime
  |       |
  |       |-- AGENTS.md              (visible to AI agents)
  |       |-- .agents/skills/        (discoverable skills)
  |       |-- .codex/ or .claude/    (target config)
  |       |-- .hforge/               (hidden canonical runtime)
  |              |-- library/        (skills, rules, knowledge)
  |              |-- runtime/        (state, indexes, findings)
  |              |-- generated/      (command catalog, launchers)
  |              |-- templates/      (workflow templates)
  |
  |-- hforge next                    (what to do now?)
  |-- hforge doctor                  (is everything healthy?)
  |-- hforge refresh                 (regenerate after changes)
```

The key idea: **visible bridges** where AI agents need discovery, **hidden canonical layer** where runtime content should stay authoritative.

---

## 🧪 Advanced Features

### 🧭 `hforge next` &mdash; Your daily starting point

Instead of wondering which command to run, just ask:

```bash
hforge next --root .
```

It checks your workspace state and recommends the single most useful action &mdash; with a reason and confidence level.

```bash
hforge next --root . --json              # Machine-readable output
hforge next --root . --apply-safe-fixes  # Auto-run if the action is safe
hforge next --root . --verbose           # Show full reasoning
```

### 🧬 Recursive runtime &mdash; For hard problems

When a task is complex enough to need structured investigation:

```bash
hforge recursive plan "investigate billing retry behavior" --task-id TASK-001 --json
hforge recursive execute RS-123 --file bundle.json --json
hforge recursive score RS-123 --json
```

This creates a durable session with working memory, checkpoints, typed action bundles, and replay capability.

### 🔬 Repo intelligence

```bash
hforge recommend . --json                  # Evidence-backed setup recommendations
hforge cartograph . --json                 # Map repo structure and boundaries
hforge classify-boundaries . --json        # Identify service boundaries
hforge synthesize-instructions . --target codex --json  # Generate target-specific guidance
```

---

## ❓ FAQ

**Do I need to install anything globally?**
No. `npx @harness-forge/cli` works without any global install. Run `hforge shell setup --yes` if you want the shorter `hforge` command.

**Does it modify my source code?**
No. Harness Forge only creates its own managed files (`AGENTS.md`, `.agents/`, `.hforge/`, `.codex/`, `.claude/`). Your application code is never touched.

**Can I use it in CI?**
Yes. Use `--yes` and `--json` flags for non-interactive, machine-readable output:
```bash
hforge init --root . --agent codex --setup-profile recommended --yes
hforge doctor --root . --json
```

**How do I remove it from a repo?**
Delete the managed directories: `.hforge/`, `.agents/`, `.codex/`, `.claude/`, `AGENTS.md`.

**Does it send telemetry?**
No. All observability data stays local under `.hforge/observability/`. Nothing is sent anywhere.

**What Node.js version do I need?**
Node.js 22 or newer.

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## 🙌 Acknowledgements

Harness Forge was inspired by [github/spec-kit](https://github.com/github/spec-kit). Credit to the GitHub team for shaping cleaner workflow models.

## 📄 License

GPL-3.0 &mdash; see [LICENSE](./LICENSE).

---

<p align="center">
  <strong>Make your AI agents better at their job.</strong>
  <br />
  <code>npx @harness-forge/cli</code>
</p>
