import { Link } from 'react-router-dom'
import { NeuralLogo } from './icons'

export default function Header({ user, role }) {
    return (
        <nav className="landing-nav">
            <div className="nav-logo">
                <NeuralLogo />
                <span>Neural ERP</span>
            </div>
            <div className="nav-links">
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="#testimonials">Testimonials</a>
                {user ? (
                    <Link to={role === 'ADMIN' || role === 'SUPER_ADMIN' ? '/admin' : '/student'} className="nav-cta">Go to Dashboard</Link>
                ) : (
                    <Link to="/login" className="nav-cta">Sign In</Link>
                )}
            </div>
        </nav>
    )
}
