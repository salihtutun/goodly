// Frontend component smoke tests — verify critical pages render without crashing.

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock @/lib/api before any component imports (avoids import.meta ESM issue)
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
  },
  formatApiError: jest.fn((e) => 'API error'),
}));

// Mock the auth context for protected pages
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
  AuthProvider: ({ children }) => children,
}));

import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Register from '../pages/Register';
import NotFound from '../pages/NotFound';
import ErrorPage from '../pages/ErrorPage';
import Terms from '../pages/Terms';
import Privacy from '../pages/Privacy';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import VerifyEmail from '../pages/VerifyEmail';

describe('Landing Page', () => {
  test('renders hero section', () => {
    render(<BrowserRouter><Landing /></BrowserRouter>);
    expect(screen.getByTestId('cta-get-started')).toBeInTheDocument();
  });

  test('renders navigation links', () => {
    render(<BrowserRouter><Landing /></BrowserRouter>);
    expect(screen.getByTestId('nav-login-link')).toBeInTheDocument();
  });
});

describe('Login Page', () => {
  test('renders login form', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
    expect(screen.getByTestId('login-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-submit-btn')).toBeInTheDocument();
  });

  test('has link to register', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
    expect(screen.getByTestId('goto-register-link')).toBeInTheDocument();
  });

  test('has link to forgot password', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
    expect(screen.getByText(/forgot/i)).toBeInTheDocument();
  });
});

describe('Register Page', () => {
  test('renders registration form', () => {
    render(<BrowserRouter><Register /></BrowserRouter>);
    expect(screen.getByTestId('register-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-submit-btn')).toBeInTheDocument();
  });

  test('has link to login', () => {
    render(<BrowserRouter><Register /></BrowserRouter>);
    expect(screen.getByTestId('goto-login-link')).toBeInTheDocument();
  });
});

describe('Error Pages', () => {
  test('NotFound page renders', () => {
    render(<BrowserRouter><NotFound /></BrowserRouter>);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  test('ErrorPage renders', () => {
    render(<BrowserRouter><ErrorPage /></BrowserRouter>);
    expect(screen.getByText(/sideways/i)).toBeInTheDocument();
  });
});

describe('Legal Pages', () => {
  test('Terms page renders', () => {
    render(<BrowserRouter><Terms /></BrowserRouter>);
    const matches = screen.getAllByText(/Terms of Service/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  test('Privacy page renders', () => {
    render(<BrowserRouter><Privacy /></BrowserRouter>);
    const matches = screen.getAllByText(/Privacy Policy/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});

describe('Auth Pages', () => {
  test('ForgotPassword page renders', () => {
    render(<BrowserRouter><ForgotPassword /></BrowserRouter>);
    expect(screen.getByTestId('forgot-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('forgot-submit-btn')).toBeInTheDocument();
  });

  test('ResetPassword page renders', () => {
    // ResetPassword needs a token param to show the form
    window.history.pushState({}, '', '/reset-password?token=test123');
    render(<BrowserRouter><ResetPassword /></BrowserRouter>);
    expect(screen.getByTestId('reset-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('reset-submit-btn')).toBeInTheDocument();
  });

  test('VerifyEmail page renders', () => {
    render(<BrowserRouter><VerifyEmail /></BrowserRouter>);
    expect(screen.getByText(/verif/i)).toBeInTheDocument();
  });
});
