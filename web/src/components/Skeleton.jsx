function Skeleton({ type = 'line', width, height, count = 1, style = {} }) {
    const baseStyle = {
        background: 'linear-gradient(90deg, var(--gray-200) 25%, var(--gray-100) 50%, var(--gray-200) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
        borderRadius: 'var(--radius-sm)',
        ...style,
    }

    const shapes = {
        line: { width: width || '100%', height: height || 16, borderRadius: 4 },
        circle: { width: width || 40, height: height || 40, borderRadius: '50%' },
        card: { width: width || '100%', height: height || 120, borderRadius: 'var(--radius-md)' },
        'table-row': { width: width || '100%', height: height || 48, borderRadius: 4 },
        avatar: { width: width || 36, height: height || 36, borderRadius: '50%' },
    }

    const shapeStyle = shapes[type] || shapes.line

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} style={{ ...baseStyle, ...shapeStyle }} className="skeleton" />
            ))}
        </div>
    )
}

export function SkeletonCard() {
    return (
        <div className="dash-card" style={{ padding: 24 }}>
            <Skeleton type="line" width="40%" height={20} style={{ marginBottom: 16 }} />
            <Skeleton type="line" count={3} />
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <Skeleton type="circle" />
                <Skeleton type="line" width="60%" />
            </div>
        </div>
    )
}

export function SkeletonTable({ rows = 5 }) {
    return (
        <div className="dash-card" style={{ padding: 24 }}>
            <Skeleton type="line" width="30%" height={22} style={{ marginBottom: 20 }} />
            <Skeleton type="table-row" count={rows} />
        </div>
    )
}

export function SkeletonLine({ width = '100%', height = 16, style = {} }) {
    return (
        <div
            style={{
                width,
                height,
                background: 'linear-gradient(90deg, var(--gray-100) 25%, var(--gray-200) 50%, var(--gray-100) 75%)',
                backgroundSize: '200% 100%',
                animation: 'skeleton-shimmer 1.5s infinite',
                borderRadius: 8,
                ...style,
            }}
        />
    )
}

export function PageSkeleton() {
    return (
        <>
            <div style={{ marginBottom: 24 }}>
                <SkeletonLine width="30%" height={28} />
            </div>
            <div className="stats-row">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="dash-stat-card">
                        <SkeletonLine width={40} height={40} style={{ borderRadius: '50%' }} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <SkeletonLine width="50%" height={20} />
                            <SkeletonLine width="70%" height={14} />
                        </div>
                    </div>
                ))}
            </div>
            <div className="dashboard-grid">
                {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                <SkeletonTable rows={5} />
            </div>
        </>
    )
}

export default Skeleton
