// Frontend component smoke tests — verify critical pages render without crashing.

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
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

// Mock the auth context for protected pages
jest.mock('../contexts/AuthContext', () => ({
  ...jest.requireActual('../contexts/AuthContext'),
  useAuth: () => ({ user: null, loading: false }),
  AuthProvider: ({ children }) => children,
}));

describe('Landing Page', () => {
  test('renders hero section', () => {
    render(<BrowserRouter><Landing /></BrowserRouter>);
    expect(screen.getByTestId('hero-cta-primary')).toBeInTheDocument();
  });

  test('renders navigation links', () => {
    render(<BrowserRouter><Landing /></BrowserRouter>);
    expect(screen.getByTestId('nav-login')).toBeInTheDocument();
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
    expect(screen.getByTestId('register-link')).toBeInTheDocument();
  });

  test('has link to forgot password', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
    expect(screen.getByTestId('forgot-password-link')).toBeInTheDocument();
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
    expect(screen.getByTestId('login-link')).toBeInTheDocument();
  });
});

describe('Error Pages', () => {
  test('NotFound page renders', () => {
    render(<BrowserRouter><NotFound /></BrowserRouter>);
    expect(screen.getByTestId('not-found')).toBeInTheDocument();
  });

  test('ErrorPage renders', () => {
    render(<BrowserRouter><ErrorPage /></BrowserRouter>);
    expect(screen.getByTestId('error-page')).toBeInTheDocument();
  });
});

describe('Legal Pages', () => {
  test('Terms page renders', () => {
    render(<BrowserRouter><Terms /></BrowserRouter>);
    expect(screen.getByText(/terms/i)).toBeInTheDocument();
  });

  test('Privacy page renders', () => {
    render(<BrowserRouter><Privacy /></BrowserRouter>);
    expect(screen.getByText(/privacy/i)).toBeInTheDocument();
  });
});

describe('Auth Pages', () => {
  test('ForgotPassword page renders', () => {
    render(<BrowserRouter><ForgotPassword /></BrowserRouter>);
    expect(screen.getByTestId('forgot-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('forgot-submit-btn')).toBeInTheDocument();
  });

  test('ResetPassword page renders', () => {
    render(<BrowserRouter><ResetPassword /></BrowserRouter>);
    expect(screen.getByTestId('reset-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('reset-submit-btn')).toBeInTheDocument();
  });

  test('VerifyEmail page renders', () => {
    render(<BrowserRouter><VerifyEmail /></BrowserRouter>);
    expect(screen.getByTestId('verify-email-message')).toBeInTheDocument();
  });
});
