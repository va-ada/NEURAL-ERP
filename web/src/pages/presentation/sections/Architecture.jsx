import { useMemo, useRef } from 'react'
import {
    // eslint-disable-next-line no-unused-vars -- used via <motion.*> JSX
    motion,
    useScroll,
    useTransform,
    useMotionValueEvent,
} from 'framer-motion'

const SERVICES = [
    // Central hub
    { id: 'gateway', label: 'API Gateway', kind: 'gateway', x: 50, y: 50 },
    // Clients
    { id: 'web', label: 'Web', kind: 'client', x: 12, y: 12 },
    { id: 'mobile', label: 'Mobile', kind: 'client', x: 88, y: 12 },
    // 13 services in a ring
    { id: 'auth', label: 'Auth', kind: 'service', x: 50, y: 6 },
    { id: 'academic', label: 'Academic', kind: 'service', x: 76, y: 14 },
    { id: 'attendance', label: 'Attendance', kind: 'service', x: 92, y: 35 },
    { id: 'timetable', label: 'Timetable', kind: 'service', x: 96, y: 62 },
    { id: 'assignment', label: 'Assignment', kind: 'service', x: 88, y: 85 },
    { id: 'grade', label: 'Grade', kind: 'service', x: 66, y: 94 },
    { id: 'career', label: 'Career', kind: 'service', x: 38, y: 94 },
    { id: 'notes', label: 'Notes', kind: 'service', x: 14, y: 88 },
    { id: 'fee', label: 'Fee', kind: 'service', x: 4, y: 65 },
    { id: 'library', label: 'Library', kind: 'service', x: 6, y: 38 },
    { id: 'forum', label: 'Forum', kind: 'service', x: 22, y: 18 },
    { id: 'notification', label: 'Notification', kind: 'service', x: 50, y: 76 },
    { id: 'admin', label: 'Admin', kind: 'service', x: 32, y: 62 },
]

function ArchNode({ node, scrollYProgress, start, end }) {
    const opacity = useTransform(scrollYProgress, [start, end], [0, 1])
    const scale = useTransform(scrollYProgress, [start, end], [0.6, 1])
    const className = `arch__node${node.kind === 'gateway' ? ' arch__node--gateway' : ''}${node.kind === 'client' ? ' arch__node--client' : ''}`
    return (
        <motion.div
            className={className}
            style={{ left: `${node.x}%`, top: `${node.y}%`, opacity, scale }}
        >
            <span className="arch__node-dot" />
            {node.label}
        </motion.div>
    )
}

export default function ArchitectureScene({ onActive }) {
    const ref = useRef(null)
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })

    useMotionValueEvent(scrollYProgress, 'change', (v) => {
        if (v > 0.15 && v < 0.85) onActive(5)
    })

    const headerY = useTransform(scrollYProgress, [0.05, 0.2], [40, 0])
    const headerOpacity = useTransform(scrollYProgress, [0.05, 0.2], [0, 1])

    // Precompute reveal order (Gateway → clients → services) and timing windows.
    const order = useMemo(() => {
        const rank = (k) => (k === 'gateway' ? 0 : k === 'client' ? 1 : 2)
        return [...SERVICES].sort((a, b) => rank(a.kind) - rank(b.kind))
    }, [])

    const reveals = useMemo(() => {
        const slot = 0.5 / order.length
        return order.map((_, i) => {
            const start = 0.22 + i * slot
            return [start, start + slot + 0.03]
        })
    }, [order])

    // Edge draw — all edges share the same progress so the mesh lights up together.
    const edgeProgress = useTransform(scrollYProgress, [0.65, 0.92], [0, 1])

    return (
        <section ref={ref} className="scene scene--arch">
            <div className="scene__pin">
                <div className="arch__pin">
                    <motion.header
                        className="arch__header"
                        style={{ opacity: headerOpacity, y: headerY }}
                    >
                        <span className="arch__kicker">ARCHITECTURE</span>
                        <h2 className="arch__title">Thirteen services. One seam.</h2>
                        <p className="arch__subtitle">
                            Every service is independently deployable, independently
                            testable, and speaks the same unified API envelope.
                        </p>
                    </motion.header>

                    <div className="arch__graph">
                        <svg className="arch__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="archEdge" x1="0" x2="1">
                                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                                    <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.8" />
                                </linearGradient>
                            </defs>
                            {SERVICES.filter((n) => n.id !== 'gateway').map((node) => (
                                <motion.line
                                    key={node.id}
                                    x1={50}
                                    y1={50}
                                    x2={node.x}
                                    y2={node.y}
                                    stroke="url(#archEdge)"
                                    strokeWidth="0.18"
                                    strokeLinecap="round"
                                    style={{ pathLength: edgeProgress }}
                                />
                            ))}
                        </svg>

                        {order.map((node, i) => (
                            <ArchNode
                                key={node.id}
                                node={node}
                                scrollYProgress={scrollYProgress}
                                start={reveals[i][0]}
                                end={reveals[i][1]}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
