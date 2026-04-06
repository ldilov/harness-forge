import { useState, useEffect, useMemo, type CSSProperties, type Dispatch } from 'react';
import type { DashboardAction, ProjectInfo } from '../state/types';
import { colors, radius, spacing } from '../styles/theme';

const STORAGE_KEY = 'hforge-dashboard-projects';

interface ProjectSelectorProps {
  readonly dispatch: Dispatch<DashboardAction>;
}

// ── localStorage helpers ──

function loadSavedProjects(): ProjectInfo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProjectInfo[]) : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: readonly ProjectInfo[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

// ── Styles ──

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: colors.bg.primary,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const containerStyle: CSSProperties = {
  width: 620,
  maxHeight: '85vh',
  display: 'flex',
  flexDirection: 'column',
};

const logoStyle: CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: colors.accent.magenta,
  textAlign: 'center',
  marginBottom: 4,
};

const subtitleStyle: CSSProperties = {
  fontSize: 13,
  color: colors.text.secondary,
  textAlign: 'center',
  marginBottom: 24,
};

const addBarStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  marginBottom: 16,
};

const inputStyle: CSSProperties = {
  flex: 1,
  background: colors.bg.card,
  border: `1px solid ${colors.border.subtle}`,
  borderRadius: radius.md,
  padding: '10px 14px',
  color: colors.text.primary,
  fontSize: 13,
  fontFamily: 'monospace',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const inputFocusedBorder = colors.accent.magenta;

const btnStyle: CSSProperties = {
  background: colors.accent.magenta,
  color: '#0B0E11',
  border: 'none',
  borderRadius: radius.md,
  padding: '10px 20px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'opacity 0.2s',
};

const searchStyle: CSSProperties = {
  ...inputStyle,
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  marginBottom: 12,
  background: colors.bg.secondary,
};

const listStyle: CSSProperties = {
  flex: 1,
  overflow: 'auto',
  paddingRight: 4,
};

const cardStyle: CSSProperties = {
  background: colors.bg.card,
  border: `1px solid ${colors.border.subtle}`,
  borderRadius: radius.lg,
  padding: spacing.lg,
  marginBottom: spacing.sm,
  cursor: 'pointer',
  transition: 'border-color 0.2s, background 0.2s, transform 0.1s',
};

const projectNameStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: colors.text.primary,
};

const projectPathStyle: CSSProperties = {
  fontSize: 11,
  color: colors.text.muted,
  fontFamily: 'monospace',
  marginTop: 4,
};

const metaRowStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  fontSize: 10,
  color: colors.text.secondary,
  marginTop: 8,
};

const badgeStyle: CSSProperties = {
  fontSize: 10,
  padding: '2px 8px',
  borderRadius: 4,
};

const removeBtnStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: colors.text.muted,
  cursor: 'pointer',
  fontSize: 16,
  padding: '4px 8px',
  borderRadius: 4,
  transition: 'color 0.2s, background 0.2s',
  lineHeight: 1,
};

const errorStyle: CSSProperties = {
  fontSize: 12,
  color: colors.accent.coral,
  marginTop: 6,
  marginBottom: 6,
};

// ── Empty state ──

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.6 }}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <rect x="8" y="12" width="48" height="40" rx="4" stroke={colors.accent.magenta} strokeWidth="2" strokeDasharray="4 3" />
          <path d="M8 20h48" stroke={colors.accent.magenta} strokeWidth="2" opacity="0.4" />
          <circle cx="14" cy="16" r="2" fill={colors.accent.coral} />
          <circle cx="20" cy="16" r="2" fill={colors.accent.amber} />
          <circle cx="26" cy="16" r="2" fill={colors.accent.mint} />
          <path d="M28 36l4-4 4 4" stroke={colors.accent.magenta} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M32 32v10" stroke={colors.accent.magenta} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ fontSize: 17, fontWeight: 600, color: colors.text.primary, marginBottom: 8 }}>
        No projects added yet
      </div>
      <div style={{ fontSize: 13, color: colors.text.secondary, lineHeight: 1.6, maxWidth: 380, margin: '0 auto' }}>
        Paste a project path above to start monitoring.<br />
        The project must have a <code style={{ color: colors.accent.peach, fontSize: 12 }}>.hforge/</code> directory.
      </div>
    </div>
  );
}

// ── Project card ──

function ProjectCard({
  project,
  isActive,
  onSelect,
  onRemove,
  hasError,
}: {
  project: ProjectInfo;
  isActive: boolean;
  onSelect: () => void;
  onRemove: (e: React.MouseEvent) => void;
  hasError: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const style: CSSProperties = {
    ...cardStyle,
    ...(hovered ? { borderColor: colors.accent.magenta, background: colors.bg.cardHover, transform: 'translateY(-1px)' } : {}),
    ...(isActive ? { borderColor: colors.accent.mint } : {}),
    ...(hasError ? { borderColor: colors.accent.coral, opacity: 0.7 } : {}),
  };

  return (
    <div
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: hasError ? colors.accent.coral : isActive ? colors.accent.mint : colors.text.muted, flexShrink: 0 }} />
            <span style={projectNameStyle}>{project.name}</span>
            {isActive && (
              <span style={{ ...badgeStyle, background: `${colors.accent.mint}18`, color: colors.accent.mint }}>CONNECTED</span>
            )}
            {hasError && (
              <span style={{ ...badgeStyle, background: `${colors.accent.coral}18`, color: colors.accent.coral }}>NOT FOUND</span>
            )}
          </div>
          <div style={projectPathStyle}>{project.rootPath}</div>
          <div style={metaRowStyle}>
            <span>Added {new Date(project.lastSeen).toLocaleDateString()}</span>
            {project.harnessVersion && (
              <span style={{ ...badgeStyle, background: `${colors.accent.violet}18`, color: colors.accent.violet }}>
                v{project.harnessVersion}
              </span>
            )}
          </div>
        </div>
        <button
          style={removeBtnStyle}
          onClick={onRemove}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.color = colors.accent.coral; (e.target as HTMLElement).style.background = `${colors.accent.coral}15`; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.color = colors.text.muted; (e.target as HTMLElement).style.background = 'none'; }}
          title="Remove project"
        >
          x
        </button>
      </div>
    </div>
  );
}

// ── Main component ──

export function ProjectSelector({ dispatch }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<ProjectInfo[]>(() => loadSavedProjects());
  const [serverProjects, setServerProjects] = useState<ProjectInfo[]>([]);
  const [activeRoot, setActiveRoot] = useState<string>('');
  const [pathInput, setPathInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [validatedPaths, setValidatedPaths] = useState<Set<string>>(new Set());
  const [invalidPaths, setInvalidPaths] = useState<Set<string>>(new Set());

  // Merge localStorage projects with server-discovered projects
  const mergedProjects = useMemo(() => {
    const byPath = new Map<string, ProjectInfo>();
    // Server projects first (they have confirmed .hforge)
    for (const p of serverProjects) {
      byPath.set(p.rootPath, p);
    }
    // Then localStorage projects (may be stale)
    for (const p of projects) {
      if (!byPath.has(p.rootPath)) {
        byPath.set(p.rootPath, p);
      }
    }
    return [...byPath.values()].sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
  }, [projects, serverProjects]);

  // Filter by search
  const filtered = useMemo(() => {
    if (!searchQuery) return mergedProjects;
    const q = searchQuery.toLowerCase();
    return mergedProjects.filter(
      (p) => p.name.toLowerCase().includes(q) || p.rootPath.toLowerCase().includes(q),
    );
  }, [mergedProjects, searchQuery]);

  // Fetch server-side known projects
  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((data: { projects: ProjectInfo[]; activeProject: string }) => {
        setServerProjects(data.projects);
        setActiveRoot(data.activeProject);
        // Also validate which paths still exist
        const valid = new Set(data.projects.map((p) => p.rootPath));
        setValidatedPaths(valid);
      })
      .catch(() => {});
  }, []);

  // Validate locally-saved projects against server
  useEffect(() => {
    const toValidate = projects.filter((p) => !validatedPaths.has(p.rootPath));
    for (const p of toValidate) {
      fetch('/api/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rootPath: p.rootPath, dryRun: true }),
      })
        .then((r) => {
          if (!r.ok) {
            setInvalidPaths((prev) => new Set([...prev, p.rootPath]));
          } else {
            setValidatedPaths((prev) => new Set([...prev, p.rootPath]));
          }
        })
        .catch(() => {
          setInvalidPaths((prev) => new Set([...prev, p.rootPath]));
        });
    }
  }, [projects, validatedPaths]);

  function handleAddPath() {
    const trimmed = pathInput.trim().replace(/\\/g, '/').replace(/\/+$/, '');
    if (!trimmed) return;

    setError(null);

    // Check if already in list
    if (mergedProjects.some((p) => p.rootPath === trimmed || p.rootPath.replace(/\\/g, '/') === trimmed)) {
      setError('This project is already in the list.');
      return;
    }

    // Validate via server
    fetch('/api/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rootPath: trimmed }),
    })
      .then((r) => r.json())
      .then((data: { switched?: boolean; error?: string; name?: string; activeProject?: string }) => {
        if (data.error) {
          setError(data.error);
          return;
        }

        const newProject: ProjectInfo = {
          rootPath: data.activeProject ?? trimmed,
          name: data.name ?? trimmed.split('/').pop() ?? trimmed,
          lastSeen: new Date().toISOString(),
        };

        const updated = [newProject, ...projects.filter((p) => p.rootPath !== newProject.rootPath)];
        setProjects(updated);
        saveProjects(updated);
        setActiveRoot(newProject.rootPath);
        setPathInput('');
        setValidatedPaths((prev) => new Set([...prev, newProject.rootPath]));
      })
      .catch(() => {
        setError('Could not validate path. Is the dashboard server running?');
      });
  }

  function handleRemove(e: React.MouseEvent, rootPath: string) {
    e.stopPropagation();
    const updated = projects.filter((p) => p.rootPath !== rootPath);
    setProjects(updated);
    saveProjects(updated);
  }

  function handleSelect(project: ProjectInfo) {
    if (invalidPaths.has(project.rootPath)) return;

    const switchAndDispatch = () => {
      dispatch({ type: 'SELECT_PROJECT', project });
    };

    if (project.rootPath === activeRoot) {
      switchAndDispatch();
      return;
    }

    fetch('/api/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rootPath: project.rootPath }),
    })
      .then((r) => r.json())
      .then(() => {
        setActiveRoot(project.rootPath);
        // Update lastSeen
        const updated = projects.map((p) =>
          p.rootPath === project.rootPath ? { ...p, lastSeen: new Date().toISOString() } : p,
        );
        setProjects(updated);
        saveProjects(updated);
        switchAndDispatch();
      })
      .catch(() => switchAndDispatch());
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAddPath();
  }

  return (
    <div style={overlayStyle}>
      <div style={containerStyle}>
        <div style={logoStyle}>Harness Forge</div>
        <div style={subtitleStyle}>Real-time observability dashboard</div>

        {/* Add project bar */}
        <div style={addBarStyle}>
          <input
            style={{ ...inputStyle, ...(inputFocused ? { borderColor: inputFocusedBorder } : {}) }}
            placeholder="Paste project path (e.g. D:/projects/my-app)"
            value={pathInput}
            onChange={(e) => { setPathInput(e.target.value); setError(null); }}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onKeyDown={handleKeyDown}
          />
          <button
            style={{ ...btnStyle, opacity: pathInput.trim() ? 1 : 0.5 }}
            onClick={handleAddPath}
            disabled={!pathInput.trim()}
          >
            Add Project
          </button>
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        {/* Search (only show if >3 projects) */}
        {mergedProjects.length > 3 && (
          <input
            style={searchStyle}
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        )}

        {/* Project list or empty state */}
        <div style={listStyle}>
          {mergedProjects.length === 0 ? (
            <EmptyState />
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: colors.text.muted }}>
              No projects match "{searchQuery}"
            </div>
          ) : (
            filtered.map((p) => (
              <ProjectCard
                key={p.rootPath}
                project={p}
                isActive={p.rootPath === activeRoot}
                onSelect={() => handleSelect(p)}
                onRemove={(e) => handleRemove(e, p.rootPath)}
                hasError={invalidPaths.has(p.rootPath)}
              />
            ))
          )}
        </div>

        {/* Footer hint */}
        {mergedProjects.length > 0 && (
          <div style={{ textAlign: 'center', fontSize: 11, color: colors.text.muted, marginTop: 12, paddingBottom: 8 }}>
            Click a project to open its dashboard. Your list is saved in this browser.
          </div>
        )}
      </div>
    </div>
  );
}
