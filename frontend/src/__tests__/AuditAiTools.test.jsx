// Audit and AiTools page component smoke tests.
// NOTE: AiTools tab-switching tests require @/lib/api mock which jest.mock
// cannot resolve through moduleNameMapper. Audit page tests work because
// they don't trigger API calls on render.

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock auth context
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@test.com', name: 'Test', role: 'user', plan: 'concierge' },
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
  }),
  AuthProvider: ({ children }) => children,
}));

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import Audit from '../pages/Audit';
import AiTools from '../pages/AiTools';


describe('Audit Page', () => {
  test('renders without crashing', () => {
    render(<BrowserRouter><Audit /></BrowserRouter>);
    expect(screen.getByTestId('audit-root')).toBeInTheDocument();
  });

  test('shows URL input field', () => {
    render(<BrowserRouter><Audit /></BrowserRouter>);
    expect(screen.getByTestId('audit-url-input')).toBeInTheDocument();
  });

  test('shows run audit button', () => {
    render(<BrowserRouter><Audit /></BrowserRouter>);
    expect(screen.getByTestId('run-audit-btn')).toBeInTheDocument();
  });

  test('shows heading text', () => {
    render(<BrowserRouter><Audit /></BrowserRouter>);
    expect(screen.getByText('Drop a website. Get the truth.')).toBeInTheDocument();
  });

  test('button is enabled by default', () => {
    render(<BrowserRouter><Audit /></BrowserRouter>);
    const btn = screen.getByTestId('run-audit-btn');
    expect(btn).not.toBeDisabled();
  });
});


describe('AiTools Page', () => {
  test('renders without crashing', () => {
    render(<BrowserRouter><AiTools /></BrowserRouter>);
    expect(screen.getByTestId('ai-tools-root')).toBeInTheDocument();
  });

  test('shows heading text', () => {
    render(<BrowserRouter><AiTools /></BrowserRouter>);
    expect(screen.getByText('Creative spark, on tap.')).toBeInTheDocument();
  });

  test('shows three tabs', () => {
    render(<BrowserRouter><AiTools /></BrowserRouter>);
    expect(screen.getByTestId('tab-meta')).toBeInTheDocument();
    expect(screen.getByTestId('tab-keywords')).toBeInTheDocument();
    expect(screen.getByTestId('tab-competitors')).toBeInTheDocument();
  });

  test('meta tab shows form by default', () => {
    render(<BrowserRouter><AiTools /></BrowserRouter>);
    expect(screen.getByTestId('meta-form')).toBeInTheDocument();
    expect(screen.getByTestId('meta-name')).toBeInTheDocument();
    expect(screen.getByTestId('meta-desc')).toBeInTheDocument();
    expect(screen.getByTestId('meta-submit')).toBeInTheDocument();
  });
});
