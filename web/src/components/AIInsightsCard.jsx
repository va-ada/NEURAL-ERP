import { useEffect, useState } from 'react';
import { predictionsAPI } from '../services/api';
import AIInsightBadge from './AIInsightBadge';
import './AIInsightsCard.css';

/**
 * Student-facing AI insights — pulls dropout risk + placement probability
 * from the ML service for the given studentId. Always shows the AI disclosure
 * via AIInsightBadge.
 *
 * In demo mode the predictions come from a synthetic-trained model. In live
 * mode they reflect real student data. The badge surfaces which one is active.
 */
function AIInsightsCard({ studentId }) {
    const [dropout, setDropout] = useState(null);
    const [placement, setPlacement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!studentId) return;
        let cancelled = false;
        setLoading(true);
        setError(null);

        Promise.all([
            predictionsAPI.getDropoutRisk(studentId).catch((e) => ({ _err: e })),
            predictionsAPI.getPlacementProbability(studentId).catch((e) => ({ _err: e })),
        ])
            .then(([d, p]) => {
                if (cancelled) return;
                if (d?._err && p?._err) {
                    setError('AI service unavailable. Try again shortly.');
                } else {
                    if (!d?._err) setDropout(d);
                    if (!p?._err) setPlacement(p);
                }
                setLoading(false);
            });

        return () => { cancelled = true; };
    }, [studentId]);

    if (loading) {
        return (
            <div className="ai-insights-card ai-insights-loading" role="status" aria-busy="true">
                <h3>AI Insights</h3>
                <p>Computing predictions…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="ai-insights-card ai-insights-error" role="alert">
                <h3>AI Insights</h3>
                <p>{error}</p>
            </div>
        );
    }

    const dataMode = dropout?.dataMode || placement?.dataMode || 'demo';
    const generatedAt = dropout?.generatedAt || placement?.generatedAt;

    const dropoutLevel = labelFromScore(dropout?.score, ['Low', 'Moderate', 'High']);
    const placementLevel = labelFromScore(placement?.score, ['Low', 'Likely', 'Strong']);

    return (
        <AIInsightBadge dataMode={dataMode} generatedAt={generatedAt}>
            <div className="ai-insights-card">
                <h3>Personalized AI Insights</h3>

                {dropout && (
                    <div className={`ai-stat ai-stat-${dropoutLevel.toLowerCase()}`}>
                        <div className="ai-stat-label">Dropout Risk</div>
                        <div className="ai-stat-value">
                            <span className="ai-stat-num">{Math.round(dropout.score)}</span>
                            <span className="ai-stat-unit">/ 100</span>
                        </div>
                        <div className="ai-stat-tier">{dropoutLevel}</div>
                        {Array.isArray(dropout.topFactors) && dropout.topFactors.length > 0 && (
                            <ul className="ai-factors">
                                {dropout.topFactors.slice(0, 3).map((f, i) => (
                                    <li key={i}>{prettyFactor(f.name)}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {placement && (
                    <div className={`ai-stat ai-stat-${placementLevel.toLowerCase()}`}>
                        <div className="ai-stat-label">Placement Probability</div>
                        <div className="ai-stat-value">
                            <span className="ai-stat-num">{Math.round(placement.score)}</span>
                            <span className="ai-stat-unit">/ 100</span>
                        </div>
                        <div className="ai-stat-tier">{placementLevel}</div>
                        {Array.isArray(placement.topFactors) && placement.topFactors.length > 0 && (
                            <ul className="ai-factors">
                                {placement.topFactors.slice(0, 3).map((f, i) => (
                                    <li key={i}>{prettyFactor(f.name)}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </AIInsightBadge>
    );
}

function labelFromScore(score, [low, mid, high]) {
    if (score == null) return low;
    if (score < 35) return low;
    if (score < 70) return mid;
    return high;
}

function prettyFactor(name) {
    return String(name)
        .replace(/_/g, ' ')
        .replace(/\bpct\b/i, '%')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default AIInsightsCard;
