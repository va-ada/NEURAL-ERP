import { useRef } from 'react'
import {
    // eslint-disable-next-line no-unused-vars -- used via <motion.*> JSX
    motion,
    useScroll,
    useTransform,
    useMotionValueEvent,
} from 'framer-motion'
import { ScrollCounter } from './shared'

export default function AIScene({ onActive }) {
    const ref = useRef(null)
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })

    useMotionValueEvent(scrollYProgress, 'change', (v) => {
        if (v > 0.2 && v < 0.8) onActive(4)
    })

    const headerY = useTransform(scrollYProgress, [0.1, 0.3], [40, 0])
    const headerOpacity = useTransform(scrollYProgress, [0.05, 0.25], [0, 1])

    const leftX = useTransform(scrollYProgress, [0.2, 0.4], [-80, 0])
    const leftOpacity = useTransform(scrollYProgress, [0.2, 0.4], [0, 1])
    const rightX = useTransform(scrollYProgress, [0.35, 0.55], [80, 0])
    const rightOpacity = useTransform(scrollYProgress, [0.35, 0.55], [0, 1])

    // Drawing the connector path
    const pathLength = useTransform(scrollYProgress, [0.5, 0.75], [0, 1])

    return (
        <section ref={ref} className="scene scene--ai">
            <div className="scene__pin">
                <div className="ai__pin">
                    <motion.header
                        className="ai__header"
                        style={{ opacity: headerOpacity, y: headerY }}
                    >
                        <span className="ai__kicker">AI INSIGHTS</span>
                        <h2 className="ai__title">
                            Data in.{' '}
                            <span style={{
                                background: 'linear-gradient(135deg, #22d3ee, #e879f9)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>Foresight out.</span>
                        </h2>
                        <p className="ai__subtitle">
                            Every attendance drop, grade slip, and assignment miss is a
                            signal. We turn thousands of them into one number you can act on.
                        </p>
                    </motion.header>

                    <motion.div
                        className="ai__panel"
                        style={{ x: leftX, opacity: leftOpacity }}
                    >
                        <div className="ai__panel-tag">INPUT · LAST 60 DAYS</div>
                        <div className="ai__panel-title">Rohit Patel · AIML Sem 6</div>
                        {[
                            ['Attendance', '78%'],
                            ['Overdue assignments', '4'],
                            ['Recent grade trend', '−1.2 GPA'],
                            ['Forum engagement', 'Low'],
                            ['Library activity', '0 in 30d'],
                            ['Placement score', '58 / 100'],
                        ].map(([k, v]) => (
                            <div key={k} className="ai__data-row">
                                <span>{k}</span>
                                <span className="ai__data-value">{v}</span>
                            </div>
                        ))}
                    </motion.div>

                    <motion.div
                        className="ai__panel"
                        style={{ x: rightX, opacity: rightOpacity }}
                    >
                        <div className="ai__panel-tag">PREDICTION · 95% CONFIDENCE</div>
                        <div className="ai__panel-title">Risk score</div>
                        <div className="ai__prediction">
                            <div className="ai__pred-score">
                                <ScrollCounter progress={scrollYProgress} from={0} to={87} start={0.6} end={0.85} />
                            </div>
                            <div className="ai__pred-label">
                                High probability of academic drop by end of semester without
                                intervention. The model is 95% confident based on the 32 students
                                who matched this trajectory last year.
                            </div>
                            <div className="ai__pred-actions">
                                <div className="ai__pred-action">◆ Suggest faculty mentorship</div>
                                <div className="ai__pred-action">◆ Flag parent notification</div>
                                <div className="ai__pred-action">◆ Adjust career recommendations</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Connector line between panels */}
                    <svg className="ai__link" viewBox="0 0 400 40" preserveAspectRatio="none" style={{ zIndex: 1 }}>
                        <defs>
                            <linearGradient id="linkGrad" x1="0" x2="1">
                                <stop offset="0%" stopColor="#22d3ee" />
                                <stop offset="100%" stopColor="#e879f9" />
                            </linearGradient>
                        </defs>
                        <motion.path
                            d="M0 20 Q 200 -5 400 20"
                            fill="none"
                            stroke="url(#linkGrad)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            style={{ pathLength, filter: 'drop-shadow(0 0 6px rgba(139,92,246,0.7))' }}
                        />
                    </svg>
                </div>
            </div>
        </section>
    )
}
