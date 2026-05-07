import { Link } from 'react-router-dom'

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem',
    textAlign: 'center',
    backgroundColor: 'var(--bg-primary, #f5f5f5)',
    color: 'var(--text-primary, #1a1a2e)',
  },
  heading: {
    fontSize: '8rem',
    fontWeight: 800,
    margin: 0,
    lineHeight: 1,
    color: 'var(--color-primary, #6c63ff)',
  },
  message: {
    fontSize: '1.5rem',
    margin: '1rem 0 2rem',
    color: 'var(--text-secondary, #555)',
  },
  link: {
    display: 'inline-block',
    padding: '0.75rem 2rem',
    backgroundColor: 'var(--color-primary, #6c63ff)',
    color: '#fff',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '1rem',
    transition: 'opacity 0.2s',
  },
}

function NotFoundPage() {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>404</h1>
      <p style={styles.message}>Page not found</p>
      <Link to="/" style={styles.link}>Go Home</Link>
    </div>
  )
}

export default NotFoundPage
