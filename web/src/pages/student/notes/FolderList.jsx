export default function FolderList({ folders }) {
    if (folders.length === 0) return null
    return (
        <div className="subject-folders">
            {folders.map((f, i) => (
                <div className="folder-card" key={i}>
                    <div className="folder-icon">{f.icon}</div>
                    <h3>{f.name}</h3>
                    <div className="folder-meta">{f.count} notes • {f.updated}</div>
                </div>
            ))}
        </div>
    )
}
