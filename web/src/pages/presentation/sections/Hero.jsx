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

export default function HeroScene({ onActive }) {
    const ref = useRef(null)
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })

    // Cube rotates continuously with a free-running motion value + scroll boost.
    const idle = useMotionValue(0)
    useEffect(() => {
        let raf
        const loop = () => {
            idle.set(idle.get() + 0.18)
            raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(raf)
    }, [idle])

    const scrollSpin = useTransform(scrollYProgress, [0, 1], [0, 360])
    const combinedSpin = useTransform([idle, scrollSpin], ([a, b]) => a + b)

    const cubeScale = useTransform(scrollYProgress, [0, 1], [1, 0.55])
    const contentY = useTransform(scrollYProgress, [0, 1], [0, -80])
    const contentOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.9, 0])
    const floorOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.35])

    useMotionValueEvent(scrollYProgress, 'change', (v) => {
        if (v < 0.6) onActive(0)
    })

    const title = 'Neural ERP'
    return (
        <section ref={ref} className="scene scene--hero">
            <Floor opacity={floorOpacity} />
            <div className="hero__cube-layer">
                <Cube spin={combinedSpin} scale={cubeScale} />
            </div>
            <motion.div className="hero__stage" style={{ opacity: contentOpacity, y: contentY }}>
                <div className="hero__content">
                    <motion.span
                        className="hero__eyebrow"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        <span className="hero__eyebrow-dot" />
                        THE OS FOR MODERN INSTITUTIONS
                    </motion.span>
                    <h1 className="hero__title">
                        {title.split('').map((ch, i) => (
                            <motion.span
                                key={i}
                                className={`hero__title-char ${i >= 7 ? 'hero__title-accent' : ''}`}
                                initial={{ y: 80, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{
                                    delay: 0.35 + i * 0.04,
                                    duration: 0.8,
                                    ease: [0.16, 1, 0.3, 1],
                                }}
                            >
                                {ch === ' ' ? ' ' : ch}
                            </motion.span>
                        ))}
                    </h1>
                    <motion.p
                        className="hero__subtitle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.1, duration: 0.8 }}
                    >
                        Thirteen microservices. One API. A dashboard for every role.
                        Attendance, grades, placements, fees, and AI insights — under a single login.
                    </motion.p>
                    <motion.div
                        className="hero__ctas"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.3, duration: 0.7 }}
                    >
                        <button className="hero__cta hero__cta--primary">Book a demo</button>
                        <button className="hero__cta hero__cta--ghost">See it live →</button>
                    </motion.div>
                </div>
            </motion.div>
            <motion.span
                className="hero__scroll-hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6, duration: 0.8 }}
            >
                Scroll to explore
            </motion.span>
        </section>
    )
}
