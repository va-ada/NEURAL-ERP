// Shared visual primitives and small utilities used by every presentation scene.
// Kept in one file because the parts are tiny and only matter alongside each other.

import { useMemo, useState } from 'react'
import {
    // eslint-disable-next-line no-unused-vars -- used via <motion.*> JSX
    motion,
    useTransform,
    useMotionValueEvent,
} from 'framer-motion'

export function Cube({ spin = 0, scale = 1 }) {
    // The six-face CSS cube. `spin` is expected to be a MotionValue driving
    // rotation; we add a slight X tilt so the isometric angle reads even at
    // rotateY = 0.
    return (
        <motion.div className="cube-wrap" style={{ scale }}>
            <motion.div
                className="cube"
                style={{ rotateY: spin, rotateX: -24 }}
            >
                <div className="cube__face cube__face--front" />
                <div className="cube__face cube__face--back" />
                <div className="cube__face cube__face--right" />
                <div className="cube__face cube__face--left" />
                <div className="cube__face cube__face--top" />
                <div className="cube__face cube__face--bottom" />
                <div className="cube__glow" />
            </motion.div>
        </motion.div>
    )
}

export function Floor({ opacity = 1 }) {
    // A repeating perspective-tilted grid with a handful of glowing tiles
    // scattered on top. Positions are stable so the floor doesn't re-shuffle
    // on every re-render.
    const tiles = useMemo(
        () => [
            { top: '30%', left: '18%', mag: true },
            { top: '45%', left: '72%' },
            { top: '60%', left: '30%' },
            { top: '24%', left: '60%' },
            { top: '70%', left: '54%', mag: true },
            { top: '50%', left: '8%' },
            { top: '38%', left: '88%', mag: true },
            { top: '66%', left: '80%' },
        ],
        []
    )
    return (
        <motion.div className="floor" style={{ opacity }}>
            {tiles.map((t, i) => (
                <span
                    key={i}
                    className={`floor__tile${t.mag ? ' floor__tile--m' : ''}`}
                    style={{ top: t.top, left: t.left, animationDelay: `${(i * 0.35).toFixed(2)}s` }}
                />
            ))}
        </motion.div>
    )
}

// A tiny "count up with scroll" that animates an integer when a motion
// value crosses target thresholds.
export function ScrollCounter({ progress, from = 0, to = 100, start = 0.4, end = 0.9, suffix = '' }) {
    const value = useTransform(progress, [start, end], [from, to])
    const [display, setDisplay] = useState(from)
    useMotionValueEvent(value, 'change', (v) => setDisplay(Math.round(v)))
    return <>{display}{suffix}</>
}
