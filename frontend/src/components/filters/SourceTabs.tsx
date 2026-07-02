interface SourceTabsProps {
  sources: { key: string; label: string; count?: number }[]
  activeSource: string
  onChange: (source: string) => void
}

export default function SourceTabs({ sources, activeSource, onChange }: SourceTabsProps) {
  return (
    <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--color-bg)' }}>
      {sources.map((source) => (
        <button
          key={source.key}
          onClick={() => onChange(source.key)}
          className="px-4 py-2 text-sm rounded-md transition-colors"
          style={{
            backgroundColor: activeSource === source.key ? 'var(--color-card-bg)' : 'transparent',
            color: activeSource === source.key ? 'var(--color-text)' : 'var(--color-text-secondary)',
            boxShadow: activeSource === source.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          {source.label}
          {source.count !== undefined && (
            <span className="ml-1.5 text-xs opacity-60">({source.count})</span>
          )}
        </button>
      ))}
    </div>
  )
}