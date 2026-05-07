import { useEffect, useRef } from 'react'
import {
    // eslint-disable-next-line no-unused-vars -- used via <motion.*> JSX
    motion,
    useScroll,
    useTransform,
    useMotionValueEvent,
    useMotionValue,
} from 'framer-motion'
import { Cube, Floor } from './shared'

export default function CTAScene({ onActive }) {
    const ref = useRef(null)
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })

    useMotionValueEvent(scrollYProgress, 'change', (v) => {
        if (v > 0.4) onActive(6)
    })

    const idle = useMotionValue(0)
    useEffect(() => {
        let raf
        const loop = () => {
            idle.set(idle.get() + 0.22)
            raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(raf)
    }, [idle])

    const titleY = useTransform(scrollYProgress, [0.1, 0.5], [40, 0])
    const titleOpacity = useTransform(scrollYProgress, [0.1, 0.5], [0, 1])
    const cubeScale = useTransform(scrollYProgress, [0.1, 0.6, 1], [0.7, 1.05, 1])

    return (
        <section ref={ref} className="scene scene--cta">
            <Floor opacity={0.6} />
            <motion.div
                className="hero__cube-layer"
                style={{ scale: cubeScale, opacity: 0.6 }}
            >
                <Cube spin={idle} />
            </motion.div>

            <motion.div
                className="cta__inner"
                style={{ y: titleY, opacity: titleOpacity }}
            >
                <h2 className="cta__title">
                    Deploy your{' '}
                    <span className="cta__title-accent">institution</span>.
                </h2>
                <p className="cta__subtitle">
                    One command spins up thirteen services, a Postgres database, a
                    Redis cache, and a dashboard for every student, faculty member,
                    and admin on your campus.
                </p>
                <div className="cta__ctas">
                    <button className="hero__cta hero__cta--primary">Book a demo</button>
                    <button className="hero__cta hero__cta--ghost">Read the docs →</button>
                </div>
            </motion.div>

            <div className="cta__footer">NEURAL ERP · 2026</div>
        </section>
    )
}
