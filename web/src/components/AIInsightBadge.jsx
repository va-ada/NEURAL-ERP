import './AIInsightBadge.css';

/**
 * Wraps any AI-derived content with the mandatory disclosure label and a
 * data-source badge ("Demo" or "Live"). Used everywhere a prediction or
 * generated recommendation is shown so users always see the transparency
 * cue per the project's ethics rule.
 *
 * Props:
 *   - dataMode:    'demo' | 'live' | 'demo-fallback' (from API response)
 *   - generatedAt: ISO-8601 timestamp string (optional)
 *   - disclaimer:  override text (default: 'AI-generated — review before saving.')
 *   - children:    the actual AI-output UI
 */
function AIInsightBadge({
    dataMode = 'demo',
    generatedAt,
    disclaimer = 'AI-generated — review before saving.',
    children,
}) {
    const sourceLabel =
        dataMode === 'live'
            ? 'Live'
            : dataMode === 'demo-fallback'
                ? 'Demo (fallback)'
                : 'Demo';

    const sourceClass = dataMode === 'live' ? 'ai-badge-live' : 'ai-badge-demo';

    return (
        <div className="ai-insight-wrapper" role="region" aria-label="AI-generated content">
            <div className="ai-insight-header">
                <span className={`ai-source-pill ${sourceClass}`} aria-label={`Data source: ${sourceLabel}`}>
                    <span className="ai-source-dot" aria-hidden="true" />
                    AI · {sourceLabel}
                </span>
                {generatedAt && (
                    <span className="ai-timestamp" title={generatedAt}>
                        {new Date(generatedAt).toLocaleString()}
                    </span>
                )}
            </div>
            <div className="ai-insight-body">{children}</div>
            <p className="ai-disclaimer" role="note">{disclaimer}</p>
        </div>
    );
}

export default AIInsightBadge;
