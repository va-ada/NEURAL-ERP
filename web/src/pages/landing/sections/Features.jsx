import { BrainIcon, ChartIcon, CareerIcon, ShieldIcon } from './icons'

const features = [
    {
        icon: <BrainIcon />,
        title: 'Smart Board Integration',
        description: 'Seamlessly connect with digital boards and interactive displays for modern classrooms'
    },
    {
        icon: <ChartIcon />,
        title: 'AI Predictive Analytics',
        description: 'Leverage machine learning to predict student performance and optimize resources'
    },
    {
        icon: <CareerIcon />,
        title: 'Career Intelligence Module',
        description: 'Connect students with opportunities using AI-powered job matching and skill analysis'
    },
    {
        icon: <ShieldIcon />,
        title: 'Military-Grade Security',
        description: 'Enterprise-level encryption and compliance with international data protection standards'
    }
]

export default function Features() {
    return (
        <section className="features-section" id="features">
            <div className="section-header">
                <h2>Why Neural ERP?</h2>
                <p>Everything you need to manage your institution effectively</p>
            </div>
            <div className="features-grid">
                {features.map((feature, i) => (
                    <div className="feature-card" key={i}>
                        <div className={`feature-icon`}>{feature.icon}</div>
                        <h3>{feature.title}</h3>
                        <p>{feature.description}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}
