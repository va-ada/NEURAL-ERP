import { Line } from 'react-chartjs-2'

const attendanceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
        y: { min: 50, max: 100, grid: { color: '#E5E7EB' }, ticks: { font: { size: 12 } } },
        x: { grid: { display: false }, ticks: { font: { size: 12 } } }
    }
}

export default function AttendanceCard({ attChart }) {
    const data = attChart ? {
        labels: attChart.labels,
        datasets: [{
            label: 'Attendance %',
            data: attChart.present.map((p, i) => {
                const total = p + (attChart.absent[i] || 0)
                return total > 0 ? Math.round((p / total) * 100) : 0
            }),
            borderColor: '#2563EB',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            fill: true, tension: 0.4,
            pointBackgroundColor: '#2563EB', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 5,
        }]
    } : null

    return (
        <div className="dash-card">
            <h2>Attendance Trend</h2>
            <div className="chart-container">
                {data
                    ? <Line data={data} options={attendanceOptions} />
                    : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 40 }}>No attendance data yet</p>
                }
            </div>
        </div>
    )
}
