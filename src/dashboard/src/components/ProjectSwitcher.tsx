import { useState, useEffect, useRef, type CSSProperties, type Dispatch } from 'react';
import type { DashboardAction, ProjectInfo } from '../state/types';
import { colors, radius, spacing } from '../styles/theme';

interface ProjectSwitcherProps {
  readonly activeProject: ProjectInfo;
  readonly dispatch: Dispatch<DashboardAction>;
}

const triggerStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 14px',
  background: `${colors.accent.magenta}12`,
  border: `1px solid ${colors.accent.magenta}35`,
  borderRadius: radius.md,
  fontSize: 13,
  fontWeight: 500,
  color: colors.accent.magenta,
  cursor: 'pointer',
  transition: 'background 0.2s, border-color 0.2s',
  position: 'relative',
  userSelect: 'none',
};

const dropdownStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 6px)',
  left: 0,
  width: 360,
  background: colors.bg.card,
  border: `1px solid ${colors.border.active}`,
  borderRadius: radius.lg,
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  zIndex: 100,
  overflow: 'hidden',
};

const searchInputStyle: CSSProperties = {
  width: '100%',
  background: colors.bg.secondary,
  border: 'none',
  borderBottom: `1px solid ${colors.border.subtle}`,
  padding: '10px 14px',
  color: colors.text.primary,
  fontSize: 12,
  outline: 'none',
};

const itemStyle: CSSProperties = {
  padding: '10px 14px',
  cursor: 'pointer',
  transition: 'background 0.15s',
  borderBottom: `1px solid ${colors.border.subtle}`,
};

const itemNameStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: colors.text.primary,
};

const itemPathStyle: CSSProperties = {
  fontSize: 10,
  color: colors.text.muted,
  fontFamily: 'monospace',
  marginTop: 2,
};

const footerStyle: CSSProperties = {
  padding: '8px 14px',
  textAlign: 'center',
  fontSize: 11,
  color: colors.accent.lavender,
  cursor: 'pointer',
  transition: 'background 0.15s',
};

const dotStyle: CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: '50%',
  background: colors.accent.mint,
  flexShrink: 0,
};

const caretStyle: CSSProperties = {
  fontSize: 10,
  opacity: 0.6,
  marginLeft: 2,
};

const STORAGE_KEY = 'hforge-dashboard-projects';

export function ProjectSwitcher({ activeProject, dispatch }: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // Load projects from localStorage + server
  useEffect(() => {
    if (!open) return;

    // From localStorage
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const local = raw ? (JSON.parse(raw) as ProjectInfo[]) : [];
      setProjects(local);
    } catch {}

    // Also fetch from server to merge
    fetch('/api/projects')
      .then((r) => r.json())
      .then((data: { projects: ProjectInfo[] }) => {
        setProjects((prev) => {
          const byPath = new Map<string, ProjectInfo>();
          for (const p of data.projects) byPath.set(p.rootPath, p);
          for (const p of prev) {
            if (!byPath.has(p.rootPath)) byPath.set(p.rootPath, p);
          }
          return [...byPath.values()].sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
        });
      })
      .catch(() => {});
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const filtered = search
    ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.rootPath.toLowerCase().includes(search.toLowerCase()))
    : projects;

  const otherProjects = filtered.filter((p) => p.rootPath !== activeProject.rootPath);

  function handleSwitch(project: ProjectInfo) {
    setOpen(false);
    setSearch('');
    if (project.rootPath === activeProject.rootPath) return;

    fetch('/api/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rootPath: project.rootPath }),
    })
      .then((r) => r.json())
      .then(() => {
        dispatch({ type: 'SELECT_PROJECT', project });
      })
      .catch(() => {});
  }

  function handleGoToSelector() {
    setOpen(false);
    dispatch({ type: 'SHOW_PROJECT_SELECTOR' });
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        style={triggerStyle}
        onClick={() => setOpen(!open)}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${colors.accent.magenta}20`; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `${colors.accent.magenta}12`; }}
      >
        <span style={dotStyle} />
        <span>{activeProject.name}</span>
        <span style={caretStyle}>{open ? '\u25B2' : '\u25BC'}</span>
      </div>

      {open && (
        <div style={dropdownStyle}>
          {projects.length > 3 && (
            <input
              style={searchInputStyle}
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          )}

          {/* Current project */}
          <div style={{ ...itemStyle, background: `${colors.accent.mint}08` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ ...dotStyle, width: 6, height: 6 }} />
              <span style={{ ...itemNameStyle, color: colors.accent.mint }}>{activeProject.name}</span>
              <span style={{ fontSize: 9, color: colors.text.muted, marginLeft: 'auto' }}>current</span>
            </div>
            <div style={itemPathStyle}>{activeProject.rootPath}</div>
          </div>

          {/* Other projects */}
          <div style={{ maxHeight: 240, overflow: 'auto' }}>
            {otherProjects.map((p) => (
              <div
                key={p.rootPath}
                style={itemStyle}
                onClick={() => handleSwitch(p)}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = colors.bg.cardHover; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div style={itemNameStyle}>{p.name}</div>
                <div style={itemPathStyle}>{p.rootPath}</div>
              </div>
            ))}
            {otherProjects.length === 0 && !search && (
              <div style={{ padding: '12px 14px', fontSize: 12, color: colors.text.muted }}>
                No other projects. Add more from the selection screen.
              </div>
            )}
            {otherProjects.length === 0 && search && (
              <div style={{ padding: '12px 14px', fontSize: 12, color: colors.text.muted }}>
                No matches for "{search}"
              </div>
            )}
          </div>

          {/* Footer: go to full selector */}
          <div
            style={footerStyle}
            onClick={handleGoToSelector}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = colors.bg.secondary; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            Manage Projects...
          </div>
        </div>
      )}
    </div>
  );
}
