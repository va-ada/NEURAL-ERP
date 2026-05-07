// Career opportunities list — used inside the student dashboard grid.

export default function CareerCard({ opportunities, onApply }) {
    return (
        <div className="dash-card">
            <h2>Career Opportunities</h2>
            {opportunities.length > 0
                ? opportunities.map((o, i) => (
                    <div className="career-item" key={i}>
                        <div className="career-logo" style={{ background: o.color }}>{o.initial}</div>
                        <div className="career-info">
                            <h4>
                                {o.role}
                                <span className={`career-type ${o.typeClass}`}>{o.type}</span>
                            </h4>
                            <p>{o.company} • {o.location}</p>
                        </div>
                        <button className="btn-apply" onClick={onApply}>Apply Now</button>
                    </div>
                ))
                : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 40 }}>No opportunities available</p>
            }
        </div>
    )
}
