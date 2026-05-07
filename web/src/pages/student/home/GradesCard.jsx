import { Bar } from 'react-chartjs-2'

const performanceOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
        x: { min: 0, max: 100, grid: { color: '#E5E7EB' }, ticks: { font: { size: 12 } } },
        y: { grid: { display: false }, ticks: { font: { size: 13 } } }
    }
}

export default function GradesCard({ perfChart }) {
    const data = perfChart ? {
        labels: perfChart.labels,
        datasets: [{
            label: 'Score',
            data: perfChart.data,
            backgroundColor: '#22C55E',
            borderRadius: 8,
            barThickness: 24,
        }]
    } : null

    return (
        <div className="dash-card">
            <h2>Performance Analytics</h2>
            <div className="chart-container">
                {data
                    ? <Bar data={data} options={performanceOptions} />
                    : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 40 }}>No grade data yet</p>
                }
            </div>
        </div>
    )
}
