import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import Header from './landing/sections/Header'
import Hero from './landing/sections/Hero'
import Features from './landing/sections/Features'
import Pricing from './landing/sections/Pricing'
import Footer from './landing/sections/Footer'
import { ArrowRight, PlayIcon, StarIcon, TrendUpIcon, UsersIcon, ClockIcon } from './landing/sections/icons'
import './LandingPage.css'

const testimonials = [
    {
        quote: '"Neural ERP transformed how we manage our institution. The AI analytics helped us improve student retention by 23%."',
        name: 'Dr. Sarah Johnson',
        role: 'Dean, Stanford University'
    },
    {
        quote: '"The career intelligence module is a game-changer. Our placement rate increased from 67% to 89% in just one year."',
        name: 'Prof. Michael Chen',
        role: 'Head, MIT Career Services'
    },
    {
        quote: '"Best investment we made. The system is intuitive, powerful, and our students love the mobile app experience."',
        name: 'Dr. Priya Sharma',
        role: 'Principal, IIT Bombay'
    }
]

function LandingPage() {
    const navigate = useNavigate()
    const { user, role } = useAuth()
    const [showDemoModal, setShowDemoModal] = useState(false)
    const [showVideoModal, setShowVideoModal] = useState(false)
    const [demoForm, setDemoForm] = useState({ name: '', email: '', institution: '', message: '' })
    const [demoSubmitted, setDemoSubmitted] = useState(false)

    function handleDemoSubmit(e) {
        e.preventDefault()

        // Build mailto link with form data pre-filled
        const recipient = 'info@neuralerp.com'
        const subject = encodeURIComponent(`Demo Request from ${demoForm.name} — ${demoForm.institution}`)
        const body = encodeURIComponent(
            `Name: ${demoForm.name}\nEmail: ${demoForm.email}\nInstitution: ${demoForm.institution}\n\nMessage:\n${demoForm.message || 'N/A'}`
        )
        window.open(`mailto:${recipient}?subject=${subject}&body=${body}`, '_self')

        setDemoSubmitted(true)
        setTimeout(() => {
            setShowDemoModal(false)
            setDemoSubmitted(false)
            setDemoForm({ name: '', email: '', institution: '', message: '' })
        }, 2000)
    }

    return (
        <div className="landing-page">
            <a href="#main-content" className="skip-link">Skip to content</a>
            <Header user={user} role={role} />
            <Hero
                onSignIn={() => navigate('/login')}
                onWatchVideo={() => setShowVideoModal(true)}
            />
            <Features />

            {/* Stats Section */}
            <section className="stats-section">
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon"><UsersIcon /></div>
                        <div className="stat-number">3,000+</div>
                        <div className="stat-label">Colleges Worldwide</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon"><TrendUpIcon /></div>
                        <div className="stat-number">10M+</div>
                        <div className="stat-label">Students Empowered</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon"><ClockIcon /></div>
                        <div className="stat-number">99.9%</div>
                        <div className="stat-label">System Uptime</div>
                    </div>
                </div>
            </section>

            <Pricing onSelectPlan={() => navigate('/login')} />

            {/* Testimonials Section */}
            <section className="testimonials-section" id="testimonials">
                <div className="section-header">
                    <h2>Trusted by Educational Leaders</h2>
                </div>
                <div className="testimonials-grid">
                    {testimonials.map((t, i) => (
                        <div className="testimonial-card" key={i}>
                            <div className="testimonial-stars">
                                {[...Array(5)].map((_, j) => <StarIcon key={j} />)}
                            </div>
                            <blockquote>{t.quote}</blockquote>
                            <div className="testimonial-author">
                                <strong>{t.name}</strong>
                                <span>{t.role}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <Footer
                onShowDemo={() => setShowDemoModal(true)}
                onShowVideo={() => setShowVideoModal(true)}
            />

            {/* Demo Modal */}
            <Modal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} title="Request a Demo">
                {demoSubmitted ? (
                    <div className="success-message">
                        <div className="success-icon">✅</div>
                        <h3>Request Sent!</h3>
                        <p>Thank you! We'll get back to you within 24 hours.</p>
                    </div>
                ) : (
                    <form className="demo-form" onSubmit={handleDemoSubmit}>
                        <div className="form-group">
                            <label>Name</label>
                            <input type="text" value={demoForm.name} onChange={e => setDemoForm({ ...demoForm, name: e.target.value })} placeholder="Your full name" required />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" value={demoForm.email} onChange={e => setDemoForm({ ...demoForm, email: e.target.value })} placeholder="name@institution.edu" required />
                        </div>
                        <div className="form-group">
                            <label>Institution</label>
                            <input type="text" value={demoForm.institution} onChange={e => setDemoForm({ ...demoForm, institution: e.target.value })} placeholder="Your institution name" required />
                        </div>
                        <div className="form-group">
                            <label>Message</label>
                            <textarea value={demoForm.message} onChange={e => setDemoForm({ ...demoForm, message: e.target.value })} placeholder="Tell us about your needs..." />
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="modal-btn-secondary" onClick={() => setShowDemoModal(false)}>Cancel</button>
                            <button type="submit" className="modal-btn-primary">Submit Request</button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Video Modal */}
            <Modal isOpen={showVideoModal} onClose={() => setShowVideoModal(false)} title="Neural ERP — Feature Walkthrough">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', borderRadius: 12, padding: 24, color: '#fff', textAlign: 'center' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid rgba(37,99,235,0.5)' }}>
                            <PlayIcon />
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>AI-Powered College Management</h3>
                        <p style={{ margin: 0, opacity: 0.7, fontSize: 14 }}>See how Neural ERP transforms education</p>
                    </div>
                    {[
                        { icon: '📊', title: 'Smart Dashboard', desc: 'Real-time analytics for attendance, grades, and career readiness' },
                        { icon: '🤖', title: 'AI Predictions', desc: 'ML models predict student performance and flag at-risk students early' },
                        { icon: '💼', title: 'Career Intelligence', desc: 'AI-matched job opportunities with skill gap analysis and score tracking' },
                        { icon: '📱', title: 'Mobile First', desc: 'Responsive design works seamlessly on all devices and platforms' },
                    ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: 14, padding: 14, background: '#F9FAFB', borderRadius: 10, alignItems: 'flex-start' }}>
                            <div style={{ fontSize: 24, lineHeight: 1 }}>{item.icon}</div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 2 }}>{item.title}</div>
                                <div style={{ fontSize: 13, color: '#6B7280' }}>{item.desc}</div>
                            </div>
                        </div>
                    ))}
                    <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} onClick={() => { setShowVideoModal(false); navigate('/login') }}>
                        Try It Now <ArrowRight />
                    </button>
                </div>
            </Modal>
        </div>
    )
}

export default LandingPage
