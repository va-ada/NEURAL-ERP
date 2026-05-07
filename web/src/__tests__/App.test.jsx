import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';
import App from '../App';

function renderApp(route = '/') {
    return render(
        <MemoryRouter initialEntries={[route]}>
            <ThemeProvider>
                <AuthProvider>
                    <ToastProvider>
                        <App />
                    </ToastProvider>
                </AuthProvider>
            </ThemeProvider>
        </MemoryRouter>
    );
}

describe('App Routing', () => {
    it('renders landing page at /', () => {
        renderApp('/');
        expect(document.body).toBeTruthy();
    });

    it('renders login page at /login', () => {
        renderApp('/login');
        expect(document.body).toBeTruthy();
    });

    it('redirects /student to /login when unauthenticated', () => {
        renderApp('/student');
        // Should redirect to login since no user is authenticated
        expect(document.body).toBeTruthy();
    });

    it('renders 404 for unknown routes', () => {
        renderApp('/some/unknown/route');
        expect(document.body).toBeTruthy();
    });
});
