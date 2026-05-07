// ════════════════════════════════════════════════════════════════
//  Neural ERP — scroll-driven presentation page (/presentation)
// ════════════════════════════════════════════════════════════════
//  Every animation on this page is bound to the user's scroll
//  position, not to time. Scroll up = rewind, scroll down = advance.
//  All JSX here is intentionally self-contained — the styling lives
//  in PresentationPage.css alongside this file.
// ════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import {
    // eslint-disable-next-line no-unused-vars -- used via <motion.*> JSX
    motion,
    useScroll,
    useSpring,
} from 'framer-motion'
import HeroScene from './presentation/sections/Hero'
import ProblemScene from './presentation/sections/Problem'
import ModulesScene from './presentation/sections/Modules'
import DashboardScene from './presentation/sections/Dashboard'
import AIScene from './presentation/sections/AI'
import ArchitectureScene from './presentation/sections/Architecture'
import CTAScene from './presentation/sections/CTA'
import './PresentationPage.css'

const SCENES = ['hero', 'problem', 'modules', 'dashboard', 'ai', 'architecture', 'cta']

export default function PresentationPage() {
    const { scrollYProgress } = useScroll()
    const scaleX = useSpring(scrollYProgress, { stiffness: 180, damping: 30, mass: 0.3 })
    const [activeScene, setActiveScene] = useState(0)

    // Prevent the body's own scrollbar theme bleeding in.
    useEffect(() => {
        const prev = document.body.style.background
        document.body.style.background = '#05050a'
        return () => {
            document.body.style.background = prev
        }
    }, [])

    return (
        <div className="pres">
            <motion.div className="pres__progress" style={{ scaleX }} />
            <div className="pres__noise" />
            <div className="pres__vignette" />

            <nav className="pres__nav">
                <div className="pres__brand">
                    <span className="pres__brand-dot" />
                    Neural ERP
                </div>
                <button className="pres__nav-cta">Book a demo</button>
            </nav>

            <nav className="pres__nav-index" aria-hidden="true">
                {SCENES.map((_, i) => (
                    <span
                        key={i}
                        className={`pres__nav-index-dot${i === activeScene ? ' pres__nav-index-dot--active' : ''}`}
                    />
                ))}
            </nav>

            <HeroScene onActive={setActiveScene} />
            <ProblemScene onActive={setActiveScene} />
            <ModulesScene onActive={setActiveScene} />
            <DashboardScene onActive={setActiveScene} />
            <AIScene onActive={setActiveScene} />
            <ArchitectureScene onActive={setActiveScene} />
            <CTAScene onActive={setActiveScene} />
        </div>
    )
}
