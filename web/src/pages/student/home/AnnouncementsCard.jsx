// "Recent Notifications" pane on the student dashboard.

export default function AnnouncementsCard({ notifications }) {
    return (
        <div className="dash-card">
            <h2>Recent Notifications</h2>
            {notifications.length > 0
                ? notifications.map((n, i) => (
                    <div className="notification-item" key={i}>
                        <div className={`notification-icon ${n.type}`}>{n.icon}</div>
                        <div className="notification-content">
                            <p>{n.text}</p>
                            <span>{n.time}</span>
                        </div>
                    </div>
                ))
                : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 40 }}>No notifications</p>
            }
        </div>
    )
}
