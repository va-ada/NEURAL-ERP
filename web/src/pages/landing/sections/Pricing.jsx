import { CheckIcon } from './icons'

const pricingPlans = [
    {
        name: 'Small Colleges',
        price: '$499',
        subtitle: 'Up to 1,000 students',
        features: ['Core ERP modules', 'Basic analytics dashboard', 'Email support', '10 GB storage', 'Mobile app access'],
        featured: false
    },
    {
        name: 'Medium Colleges',
        price: '$999',
        subtitle: '1,000 - 5,000 students',
        features: ['All Small features', 'AI predictive analytics', 'Priority support 24/7', '50 GB storage', 'Career intelligence module'],
        featured: true
    },
    {
        name: 'Large Universities',
        price: '$1,999',
        subtitle: '5,000+ students',
        features: ['All Medium features', 'Custom integrations', 'Dedicated account manager', 'Unlimited storage', 'Advanced security features'],
        featured: false
    }
]

export default function Pricing({ onSelectPlan }) {
    return (
        <section className="pricing-section" id="pricing">
            <div className="section-header">
                <h2>Choose Your Plan</h2>
                <p>Flexible pricing for institutions of all sizes</p>
            </div>
            <div className="pricing-grid">
                {pricingPlans.map((plan, i) => (
                    <div className={`pricing-card ${plan.featured ? 'featured' : ''}`} key={i}>
                        {plan.featured && <div className="pricing-badge">Most Popular</div>}
                        <h3>{plan.name}</h3>
                        <div className="pricing-price">
                            <span className="amount">{plan.price}</span>
                            <span className="period">/mo</span>
                        </div>
                        <div className="pricing-subtitle">{plan.subtitle}</div>
                        <ul className="pricing-features">
                            {plan.features.map((f, j) => (
                                <li key={j}><CheckIcon /> {f}</li>
                            ))}
                        </ul>
                        <button className={`pricing-btn ${plan.featured ? 'primary' : 'outline'}`} onClick={onSelectPlan}>
                            Get Started
                        </button>
                    </div>
                ))}
            </div>
        </section>
    )
}
