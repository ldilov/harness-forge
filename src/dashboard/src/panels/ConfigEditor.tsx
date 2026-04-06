import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { Panel } from '../components/Panel';
import { colors, radius, spacing } from '../styles/theme';

const configs = ['memory-policy', 'context-budget', 'load-order'] as const;
type ConfigName = typeof configs[number];

const selectStyle: CSSProperties = {
  background: colors.bg.primary,
  color: colors.text.primary,
  border: `1px solid ${colors.border.subtle}`,
  borderRadius: radius.sm,
  padding: '4px 8px',
  fontSize: 11,
  cursor: 'pointer',
  outline: 'none',
};

const textareaStyle: CSSProperties = {
  width: '100%',
  minHeight: 200,
  background: colors.bg.primary,
  color: colors.text.primary,
  border: `1px solid ${colors.border.subtle}`,
  borderRadius: radius.sm,
  padding: spacing.sm,
  fontFamily: 'monospace',
  fontSize: 11,
  resize: 'vertical',
  outline: 'none',
  boxSizing: 'border-box',
};

const btnStyle: CSSProperties = {
  background: colors.accent.mint,
  color: '#0B0E11',
  border: 'none',
  borderRadius: radius.sm,
  padding: '6px 16px',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
};

const btnOutlineStyle: CSSProperties = {
  ...btnStyle,
  background: 'transparent',
  color: colors.text.secondary,
  border: `1px solid ${colors.border.subtle}`,
};

export function ConfigEditor() {
  const [selected, setSelected] = useState<ConfigName>('memory-policy');
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'modified' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDefaults, setIsDefaults] = useState(false);

  const loadConfig = useCallback(async (name: ConfigName) => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch(`/api/config/${name}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as { content: unknown; source?: string };
      const formatted = JSON.stringify(data.content, null, 2);
      setContent(formatted);
      setOriginalContent(formatted);
      setIsDefaults(data.source === 'defaults');
      setStatus('idle');
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load');
    }
  }, []);

  useEffect(() => {
    void loadConfig(selected);
  }, [selected, loadConfig]);

  const handleSave = async () => {
    setStatus('saving');
    setErrorMsg('');
    try {
      const parsed: unknown = JSON.parse(content);
      const res = await fetch(`/api/config/${selected}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: parsed }),
      });
      if (!res.ok) throw new Error(await res.text());
      setOriginalContent(content);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const isModified = content !== originalContent;

  return (
    <Panel title="Configuration" subtitle="Edit runtime config files">
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: spacing.sm }}>
        <select
          style={selectStyle}
          value={selected}
          onChange={(e) => setSelected(e.target.value as ConfigName)}
        >
          {configs.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span style={{ flex: 1 }} />
        {isDefaults && status === 'idle' && <span style={{ color: colors.text.muted, fontSize: 10, fontStyle: 'italic' }}>defaults — save to create file</span>}
        {status === 'saved' && <span style={{ color: colors.accent.mint, fontSize: 11 }}>Saved ✓</span>}
        {status === 'error' && <span style={{ color: colors.accent.coral, fontSize: 11 }}>{errorMsg}</span>}
        {isModified && status !== 'saving' && <span style={{ color: colors.accent.amber, fontSize: 11 }}>Modified</span>}
      </div>
      <textarea
        style={textareaStyle}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          if (status !== 'error') setStatus('modified');
        }}
        spellCheck={false}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: spacing.sm }}>
        <button
          style={isModified ? btnStyle : { ...btnStyle, opacity: 0.5, cursor: 'default' }}
          onClick={isModified ? () => void handleSave() : undefined}
          disabled={!isModified || status === 'saving'}
        >
          {status === 'saving' ? 'Saving...' : 'Save'}
        </button>
        <button
          style={btnOutlineStyle}
          onClick={() => void loadConfig(selected)}
        >
          Reset
        </button>
      </div>
    </Panel>
  );
}
