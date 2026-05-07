import { ArrowRight, PlayIcon, TrendUpIcon } from './icons'

export default function Hero({ onSignIn, onWatchVideo }) {
    return (
        <section className="hero" id="main-content">
            <div className="hero-content">
                <h1>Transform Your College with AI-Powered Management</h1>
                <p>Comprehensive ERP platform connecting academics, career services, and intelligent analytics in one secure system</p>
                <div className="hero-buttons">
                    <button className="btn-primary" onClick={onSignIn}>
                        Sign In <ArrowRight />
                    </button>
                    <button className="btn-secondary" onClick={onWatchVideo}>
                        <PlayIcon /> Watch Video
                    </button>
                </div>
            </div>
            <div className="hero-illustration">
                <div className="hero-dashboard-card">
                    <div className="card-header">
                        <div className="icon-circle">
                            <TrendUpIcon />
                        </div>
                        <div>
                            <span>Dashboard Overview</span>
                            <span>Live Analytics</span>
                        </div>
                    </div>
                    <div className="hero-bars">
                        <div className="hero-bar"><div className="hero-bar-fill blue" style={{ width: '75%' }}></div></div>
                        <div className="hero-bar"><div className="hero-bar-fill green" style={{ width: '85%' }}></div></div>
                        <div className="hero-bar"><div className="hero-bar-fill light-blue" style={{ width: '65%' }}></div></div>
                    </div>
                </div>
            </div>
        </section>
    )
}
