import { useRef } from 'react'
import {
    // eslint-disable-next-line no-unused-vars -- used via <motion.*> JSX
    motion,
    useScroll,
    useTransform,
    useMotionValueEvent,
} from 'framer-motion'

export default function DashboardScene({ onActive }) {
    const ref = useRef(null)
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })

    useMotionValueEvent(scrollYProgress, 'change', (v) => {
        if (v > 0.2 && v < 0.8) onActive(3)
    })

    const scale = useTransform(scrollYProgress, [0.1, 0.5, 0.9], [0.82, 1, 0.94])
    const rotateX = useTransform(scrollYProgress, [0.1, 0.5, 0.9], [22, 0, -8])
    const rotateZ = useTransform(scrollYProgress, [0.1, 0.5, 0.9], [-2, 0, 1])
    const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0])

    const c1Opacity = useTransform(scrollYProgress, [0.35, 0.55], [0, 1])
    const c1Y = useTransform(scrollYProgress, [0.35, 0.55], [24, 0])
    const c2Opacity = useTransform(scrollYProgress, [0.45, 0.65], [0, 1])
    const c2Y = useTransform(scrollYProgress, [0.45, 0.65], [24, 0])
    const c3Opacity = useTransform(scrollYProgress, [0.55, 0.75], [0, 1])
    const c3Y = useTransform(scrollYProgress, [0.55, 0.75], [24, 0])
    const c4Opacity = useTransform(scrollYProgress, [0.65, 0.85], [0, 1])
    const c4Y = useTransform(scrollYProgress, [0.65, 0.85], [24, 0])
    const c1 = { opacity: c1Opacity, y: c1Y }
    const c2 = { opacity: c2Opacity, y: c2Y }
    const c3 = { opacity: c3Opacity, y: c3Y }
    const c4 = { opacity: c4Opacity, y: c4Y }

    return (
        <section ref={ref} className="scene scene--dashboard">
            <div className="scene__pin">
                <div className="dashboard__pin">
                    <motion.header
                        className="dashboard__header"
                        style={{ opacity }}
                    >
                        <span className="dashboard__kicker">ONE DASHBOARD, EVERY ROLE</span>
                        <h2 className="dashboard__title">See the institution, live.</h2>
                        <p style={{ color: 'var(--pres-ink-dim)', fontSize: '15px' }}>
                            Students, faculty, and admins get role-scoped views — backed by
                            the same audited data.
                        </p>
                    </motion.header>

                    <motion.div
                        className="dashboard__mock"
                        style={{ scale, rotateX, rotateZ, opacity, transformPerspective: 1400 }}
                    >
                        <div className="dashboard__toolbar">
                            <div className="dashboard__traffic">
                                <span /><span /><span />
                            </div>
                            <div className="dashboard__url">neural-erp.sfit.edu/admin/dashboard</div>
                        </div>
                        <div className="dashboard__body">
                            <aside className="dashboard__sidebar">
                                {['Overview', 'Students', 'Faculty', 'Analytics', 'Placements', 'Audit'].map(
                                    (n, i) => (
                                        <div
                                            key={n}
                                            className={`dashboard__nav-item${i === 0 ? ' dashboard__nav-item--active' : ''}`}
                                        >
                                            ● {n}
                                        </div>
                                    )
                                )}
                            </aside>
                            <main className="dashboard__content">
                                <div className="dashboard__stats">
                                    {[
                                        ['1,284', 'Students'],
                                        ['87%', 'Attendance'],
                                        ['8.2', 'Avg CGPA'],
                                        ['42', 'At-risk'],
                                    ].map(([v, l]) => (
                                        <div key={l} className="dashboard__stat-card">
                                            <div className="dashboard__stat-card-value">{v}</div>
                                            <div className="dashboard__stat-card-label">{l}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="dashboard__chart">
                                    <div className="dashboard__chart-title">ATTENDANCE — LAST 30 DAYS</div>
                                    <svg className="dashboard__chart-svg" viewBox="0 0 400 140" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="dashFill" x1="0" x2="0" y1="0" y2="1">
                                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
                                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                                            </linearGradient>
                                            <linearGradient id="dashLine" x1="0" x2="1" y1="0" y2="0">
                                                <stop offset="0%" stopColor="#22d3ee" />
                                                <stop offset="100%" stopColor="#e879f9" />
                                            </linearGradient>
                                        </defs>
                                        <path
                                            d="M0 100 L30 92 L60 85 L90 90 L120 72 L150 68 L180 60 L210 55 L240 48 L270 56 L300 42 L330 38 L360 32 L400 28 L400 140 L0 140 Z"
                                            fill="url(#dashFill)"
                                        />
                                        <path
                                            d="M0 100 L30 92 L60 85 L90 90 L120 72 L150 68 L180 60 L210 55 L240 48 L270 56 L300 42 L330 38 L360 32 L400 28"
                                            fill="none"
                                            stroke="url(#dashLine)"
                                            strokeWidth="2"
                                        />
                                    </svg>
                                </div>
                            </main>
                        </div>
                    </motion.div>

                    <motion.div className="dashboard__callout dashboard__callout--tl" style={c1}>
                        <span className="dashboard__callout-dot" /> Role-scoped data
                    </motion.div>
                    <motion.div className="dashboard__callout dashboard__callout--tr" style={c2}>
                        <span className="dashboard__callout-dot" style={{ background: '#e879f9', boxShadow: '0 0 10px #e879f9' }} /> Realtime sync
                    </motion.div>
                    <motion.div className="dashboard__callout dashboard__callout--bl" style={c3}>
                        <span className="dashboard__callout-dot" style={{ background: '#a78bfa', boxShadow: '0 0 10px #a78bfa' }} /> Audit-logged actions
                    </motion.div>
                    <motion.div className="dashboard__callout dashboard__callout--br" style={c4}>
                        <span className="dashboard__callout-dot" /> One Prisma schema
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
