import { Component } from 'react'

class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary" role="alert" aria-live="assertive">
                    <div className="error-boundary-content">
                        <div className="error-boundary-icon" aria-hidden="true">⚠️</div>
                        <h2>Something went wrong</h2>
                        <p>An unexpected error occurred. Please try again.</p>
                        <pre className="error-boundary-details">{this.state.error?.message}</pre>
                        <button
                            className="btn-primary"
                            onClick={() => {
                                this.setState({ hasError: false, error: null })
                                window.location.reload()
                            }}
                            aria-label="Reload page"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            )
        }
        return this.props.children
    }
}

export default ErrorBoundary
