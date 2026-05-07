import { useEffect, useRef, useState } from 'react'
import {
    // eslint-disable-next-line no-unused-vars -- used via <motion.*> JSX
    motion,
    useScroll,
    useTransform,
    useSpring,
    useMotionValueEvent,
} from 'framer-motion'

const MODULES = [
    {
        tag: 'Module 01',
        title: 'Academic',
        description: 'Institutions, departments, batches, subjects, faculty assignments — one canonical model, multi-tenant from day zero.',
        icon: '🎓',
        color: '#22d3ee',
        stats: [['30+', 'Data models'], ['∞', 'Institutions']],
    },
    {
        tag: 'Module 02',
        title: 'Attendance',
        description: 'Per-session attendance with trend analysis, at-risk detection, and faculty rollups. Marks sync across web, mobile, and smartboards.',
        icon: '📋',
        color: '#8b5cf6',
        stats: [['3', 'Surface areas'], ['<300ms', 'Mark-to-DB']],
    },
    {
        tag: 'Module 03',
        title: 'Grades & Exams',
        description: 'Semester results, CGPA calculations, exam scheduling, deterministic grade arithmetic. No spreadsheet drift.',
        icon: '📊',
        color: '#e879f9',
        stats: [['5', 'Grade types'], ['5', 'Exam types']],
    },
    {
        tag: 'Module 04',
        title: 'Career',
        description: 'Opportunity board, applications pipeline, skill tracking, placement analytics. Every student has a career score that trends.',
        icon: '💼',
        color: '#f59e0b',
        stats: [['7', 'App states'], ['Live', 'Rankings']],
    },
    {
        tag: 'Module 05',
        title: 'Notes & Smartboard',
        description: 'Folders, bookmarks, shared notes, and QR-code capture of smartboard PDFs pushed straight from the classroom.',
        icon: '📝',
        color: '#10b981',
        stats: [['QR', 'Capture'], ['S3', 'Ready']],
    },
    {
        tag: 'Module 06',
        title: 'Fees & Library',
        description: 'Tuition, exam, and lab fees with payments and fines; books with issue/return and overdue tracking.',
        icon: '💰',
        color: '#ef4444',
        stats: [['4', 'Fee types'], ['4', 'Book states']],
    },
    {
        tag: 'Module 07',
        title: 'Forum & Alerts',
        description: 'Department-wide forum, threaded replies, announcements, and scoped notifications — the social layer of the institution.',
        icon: '💬',
        color: '#3b82f6',
        stats: [['Threaded', 'Replies'], ['Scoped', 'Alerts']],
    },
]

export default function ModulesScene({ onActive }) {
    const ref = useRef(null)
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

    const [overshoot, setOvershoot] = useState(0)
    useEffect(() => {
        const measure = () => {
            const vw = window.innerWidth
            const cardW = Math.min(460, Math.max(360, vw * 0.32))
            const gap = 36
            const padding = vw * 0.12
            const totalWidth = MODULES.length * cardW + (MODULES.length - 1) * gap + padding * 2
            setOvershoot(Math.max(0, totalWidth - vw))
        }
        measure()
        window.addEventListener('resize', measure)
        return () => window.removeEventListener('resize', measure)
    }, [])

    const rawX = useTransform(scrollYProgress, [0.05, 0.95], [0, -overshoot])
    const x = useSpring(rawX, { stiffness: 90, damping: 25, mass: 0.6 })

    useMotionValueEvent(scrollYProgress, 'change', (v) => {
        if (v > 0.05 && v < 0.95) onActive(2)
    })

    return (
        <section ref={ref} className="scene scene--modules">
            <div className="modules__pin">
                <div className="modules__header">
                    <span className="modules__kicker">ONE PLATFORM</span>
                    <h2 className="modules__title">Seven modules, shared schema.</h2>
                    <p className="modules__subtitle">
                        Each module is an independent service — they compose through the
                        gateway and share a single Prisma schema.
                    </p>
                </div>
                <motion.div className="modules__track" style={{ x }}>
                    {MODULES.map((m) => (
                        <article
                            key={m.title}
                            className="module-card"
                            style={{ '--module-color': m.color }}
                        >
                            <div className="module-card__glow" />
                            <div className="module-card__icon">{m.icon}</div>
                            <div className="module-card__meta">
                                <div className="module-card__tag">{m.tag}</div>
                                <h3 className="module-card__title">{m.title}</h3>
                                <p className="module-card__description">{m.description}</p>
                            </div>
                            <div className="module-card__stats">
                                {m.stats.map(([value, label]) => (
                                    <div key={label}>
                                        <div className="module-card__stat-value">{value}</div>
                                        <div className="module-card__stat-label">{label}</div>
                                    </div>
                                ))}
                            </div>
                        </article>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
