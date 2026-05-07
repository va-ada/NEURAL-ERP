// Shared subject list and byte formatter for the smartboard sub-pages.
// Kept out of the .jsx files so that fast-refresh keeps working
// (react-refresh/only-export-components rule).

export const SUBJECTS = [
    'Machine Learning',
    'Deep Learning',
    'Natural Language Processing',
    'Computer Vision',
    'Data Structures & Algorithms',
    'Probability & Statistics',
    'Database Systems',
    'Operating Systems',
    'Computer Networks',
    'Software Engineering',
]

export function formatBytes(bytes) {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
