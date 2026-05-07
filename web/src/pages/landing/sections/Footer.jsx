import { NeuralLogo } from './icons'

export default function Footer({ onShowDemo, onShowVideo }) {
    return (
        <footer className="landing-footer">
            <div className="footer-content">
                <div className="footer-brand">
                    <div className="nav-logo">
                        <NeuralLogo />
                        <span>Neural ERP</span>
                    </div>
                    <p>Empowering education through intelligent technology</p>
                </div>
                <div className="footer-column">
                    <h4>Product</h4>
                    <ul>
                        <li><a href="#features">Features</a></li>
                        <li><a href="#pricing">Pricing</a></li>
                        <li><a href="#testimonials">Case Studies</a></li>
                        <li><a href="#" onClick={e => { e.preventDefault(); onShowVideo() }}>Watch Demo</a></li>
                    </ul>
                </div>
                <div className="footer-column">
                    <h4>Company</h4>
                    <ul>
                        <li><a href="#testimonials">About Us</a></li>
                        <li><a href="#" onClick={e => { e.preventDefault(); onShowDemo() }}>Contact Us</a></li>
                        <li><a href="#" onClick={e => { e.preventDefault(); onShowDemo() }}>Request Demo</a></li>
                        <li><a href="#testimonials">Partners</a></li>
                    </ul>
                </div>
                <div className="footer-column">
                    <h4>Resources</h4>
                    <ul>
                        <li><a href="#features">Documentation</a></li>
                        <li><a href="#pricing">Plans & Pricing</a></li>
                        <li><a href="#features">Security</a></li>
                        <li><a href="#features">System Status</a></li>
                    </ul>
                </div>
            </div>
            <div className="footer-bottom">
                © 2026 Neural ERP. All rights reserved. Built for St. Francis Institute of Technology
            </div>
        </footer>
    )
}
