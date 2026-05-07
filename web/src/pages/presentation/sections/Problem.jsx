import { useRef } from 'react'
import {
    // eslint-disable-next-line no-unused-vars -- used via <motion.*> JSX
    motion,
    useScroll,
    useTransform,
    useMotionValueEvent,
} from 'framer-motion'

const PROBLEM_STATS = [
    { value: '73%', label: 'of faculty spend 10+ hours weekly on paperwork that could be automated.' },
    { value: '8.2×', label: 'more time-to-insight when attendance, grades, and placements live in separate systems.' },
    { value: '1 in 4', label: 'at-risk students are identified too late because siloed data never correlates.' },
]

export default function ProblemScene({ onActive }) {
    const ref = useRef(null)
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })

    useMotionValueEvent(scrollYProgress, 'change', (v) => {
        if (v > 0.2 && v < 0.8) onActive(1)
    })

    // Title springs up at the start; three cards sequenced along the pin.
    const titleY = useTransform(scrollYProgress, [0.1, 0.3], [40, 0])
    const titleOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1])

    const s0Opacity = useTransform(scrollYProgress, [0.28, 0.48], [0, 1])
    const s0Y = useTransform(scrollYProgress, [0.28, 0.48], [60, 0])
    const s0Scale = useTransform(scrollYProgress, [0.28, 0.48], [0.94, 1])

    const s1Opacity = useTransform(scrollYProgress, [0.42, 0.62], [0, 1])
    const s1Y = useTransform(scrollYProgress, [0.42, 0.62], [60, 0])
    const s1Scale = useTransform(scrollYProgress, [0.42, 0.62], [0.94, 1])

    const s2Opacity = useTransform(scrollYProgress, [0.56, 0.76], [0, 1])
    const s2Y = useTransform(scrollYProgress, [0.56, 0.76], [60, 0])
    const s2Scale = useTransform(scrollYProgress, [0.56, 0.76], [0.94, 1])

    const styles = [
        { opacity: s0Opacity, y: s0Y, scale: s0Scale },
        { opacity: s1Opacity, y: s1Y, scale: s1Scale },
        { opacity: s2Opacity, y: s2Y, scale: s2Scale },
    ]

    return (
        <section ref={ref} className="scene scene--problem">
            <div className="scene__pin">
                <div className="problem__pin">
                    <motion.span className="problem__kicker" style={{ opacity: titleOpacity }}>
                        THE PROBLEM
                    </motion.span>
                    <motion.h2
                        className="problem__title"
                        style={{ y: titleY, opacity: titleOpacity }}
                    >
                        Institutional data is everywhere.{' '}
                        <span style={{ color: '#e879f9' }}>Insight is nowhere.</span>
                    </motion.h2>
                    <div className="problem__stats">
                        {PROBLEM_STATS.map((s, i) => (
                            <motion.article
                                key={i}
                                className="problem__stat"
                                style={styles[i]}
                            >
                                <div className="problem__stat-value">{s.value}</div>
                                <div className="problem__stat-label">{s.label}</div>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
