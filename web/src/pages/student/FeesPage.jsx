import { useState } from 'react'
import { useToast } from '../../context/ToastContext'

const feeStructure = [
    { item: 'Tuition Fee', amount: 85000 },
    { item: 'Laboratory Fee', amount: 15000 },
    { item: 'Library Fee', amount: 5000 },
    { item: 'Technology Fee', amount: 8000 },
    { item: 'Exam Fee', amount: 3000 },
    { item: 'Student Activity Fee', amount: 4000 },
]

const paymentHistory = [
    { id: 'PAY-2026-001', date: 'Jan 15, 2026', amount: 60000, method: 'UPI', status: 'Paid', semester: 'Sem 6 - Installment 1' },
    { id: 'PAY-2025-006', date: 'Jul 10, 2025', amount: 120000, method: 'Net Banking', status: 'Paid', semester: 'Sem 5 - Full' },
    { id: 'PAY-2025-003', date: 'Jan 12, 2025', amount: 60000, method: 'UPI', status: 'Paid', semester: 'Sem 4 - Installment 1' },
    { id: 'PAY-2025-004', date: 'Mar 15, 2025', amount: 60000, method: 'Card', status: 'Paid', semester: 'Sem 4 - Installment 2' },
]

function FeesPage() {
    const { showToast } = useToast()
    const [showPayModal, setShowPayModal] = useState(false)
    const totalFee = feeStructure.reduce((a, f) => a + f.amount, 0)
    const paid = 60000
    const due = totalFee - paid

    function handlePay() {
        setShowPayModal(false)
        showToast('Payment initiated! Redirecting to payment gateway...', 'info')
    }

    return (
        <div>
            <div className="dashboard-header">
                <h1>Fee Payment</h1>
                <div className="header-right">
                    <button className="btn-primary" onClick={() => setShowPayModal(true)}>Pay Now</button>
                </div>
            </div>

            <div className="stats-row">
                <div className="dash-stat-card">
                    <div className="dash-stat-icon blue">💰</div>
                    <div className="dash-stat-info">
                        <h3>₹{totalFee.toLocaleString()}</h3>
                        <p>Total Fee</p>
                        <span className="trend">Semester 6</span>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon green">✅</div>
                    <div className="dash-stat-info">
                        <h3>₹{paid.toLocaleString()}</h3>
                        <p>Paid</p>
                        <span className="trend up">Installment 1 done</span>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon red">⏳</div>
                    <div className="dash-stat-info">
                        <h3>₹{due.toLocaleString()}</h3>
                        <p>Due Amount</p>
                        <span className="trend down">Due Mar 15</span>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon purple">📅</div>
                    <div className="dash-stat-info">
                        <h3>Mar 15</h3>
                        <p>Next Due Date</p>
                        <span className="trend">13 days left</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Fee Structure */}
                <div className="dash-card">
                    <h2>Fee Structure — Semester 6</h2>
                    <table className="faculty-table" aria-label="Fee structure for semester 6" style={{ width: '100%' }}>
                        <thead>
                            <tr><th>Item</th><th style={{ textAlign: 'right' }}>Amount</th></tr>
                        </thead>
                        <tbody>
                            {feeStructure.map((f, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 500 }}>{f.item}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{f.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                            <tr>
                                <td style={{ fontWeight: 700, paddingTop: 16, borderTop: '2px solid var(--gray-200)' }}>Total</td>
                                <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 18, paddingTop: 16, borderTop: '2px solid var(--gray-200)', color: 'var(--primary)' }}>
                                    ₹{totalFee.toLocaleString()}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Payment Progress */}
                <div className="dash-card">
                    <h2>Payment Progress</h2>
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>₹{paid.toLocaleString()} / ₹{totalFee.toLocaleString()}</span>
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>{Math.round(paid / totalFee * 100)}%</span>
                        </div>
                        <div style={{ height: 12, background: 'var(--gray-200)', borderRadius: 6, overflow: 'hidden' }}>
                            <div style={{ width: `${paid / totalFee * 100}%`, height: '100%', borderRadius: 6, background: 'linear-gradient(90deg, var(--primary), var(--success))' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)' }}>
                            <span style={{ fontWeight: 600 }}>Installment 1</span>
                            <span className="status-badge safe">Paid — Jan 15</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)' }}>
                            <span style={{ fontWeight: 600 }}>Installment 2</span>
                            <span className="status-badge warning">Due — Mar 15</span>
                        </div>
                    </div>
                </div>

                {/* Payment History */}
                <div className="dash-card full-width">
                    <h2>Payment History</h2>
                    <table className="faculty-table" aria-label="Payment history" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Receipt</th>
                                <th>Description</th>
                                <th>Date</th>
                                <th>Method</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paymentHistory.map((p, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{p.id}</td>
                                    <td>{p.semester}</td>
                                    <td>{p.date}</td>
                                    <td>{p.method}</td>
                                    <td style={{ fontWeight: 600 }}>₹{p.amount.toLocaleString()}</td>
                                    <td><span className="status-badge safe">{p.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pay Modal */}
            {showPayModal && (
                <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
                    <div className="modal-content" role="dialog" aria-modal="true" aria-label="Make payment" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Make Payment</h2>
                            <button className="modal-close" aria-label="Close payment dialog" onClick={() => setShowPayModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-row"><span className="detail-label">Amount Due</span><span className="detail-value" style={{ color: 'var(--danger)' }}>₹{due.toLocaleString()}</span></div>
                            <div className="detail-row"><span className="detail-label">Due Date</span><span className="detail-value">Mar 15, 2026</span></div>
                            <div className="detail-row"><span className="detail-label">Description</span><span className="detail-value">Sem 6 - Installment 2</span></div>
                            <div className="demo-form" style={{ marginTop: 16 }}>
                                <div className="form-group">
                                    <label htmlFor="payment-method">Payment Method</label>
                                    <select id="payment-method" style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit', fontSize: 14 }}>
                                        <option>UPI</option>
                                        <option>Net Banking</option>
                                        <option>Credit/Debit Card</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button className="modal-btn-secondary" onClick={() => setShowPayModal(false)}>Cancel</button>
                                <button className="modal-btn-primary" onClick={handlePay}>Pay ₹{due.toLocaleString()}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default FeesPage
