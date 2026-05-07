export default function ErrorState({ message, onRetry }) {
    return (
        <div
            role="alert"
            aria-live="polite"
            style={{
                textAlign: 'center',
                padding: '48px 24px',
                color: 'var(--gray-500, #6B7280)',
            }}
        >
            <div aria-hidden="true" style={{ fontSize: 48, marginBottom: 12 }}>!</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, color: 'var(--gray-700, #374151)' }}>
                Something went wrong
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 14 }}>
                {message || 'Failed to load data. Please try again.'}
            </p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    aria-label="Retry"
                    style={{
                        padding: '8px 20px',
                        borderRadius: 8,
                        border: '1px solid var(--gray-300, #D1D5DB)',
                        background: 'var(--bg-card, #fff)',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 500,
                    }}
                >
                    Try Again
                </button>
            )}
        </div>
    )
}
