// Audit and AiTools page component smoke tests.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

// Mock @/lib/api before any component imports (avoids import.meta ESM issue)
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ data: [] }),
    post: jest.fn().mockResolvedValue({ data: {} }),
  },
  formatApiError: jest.fn((e) => 'API error'),
}));

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import Audit from '../pages/Audit';
import AiTools from '../pages/AiTools';


describe('Audit Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  test('clicking keywords tab shows keywords form', async () => {
    render(<BrowserRouter><AiTools /></BrowserRouter>);
    fireEvent.click(screen.getByTestId('tab-keywords'));
    await waitFor(() => {
      expect(screen.getByTestId('keywords-form')).toBeInTheDocument();
    });
    expect(screen.getByTestId('kw-topic')).toBeInTheDocument();
    expect(screen.getByTestId('kw-submit')).toBeInTheDocument();
  });

  test('clicking competitors tab shows competitors form', async () => {
    render(<BrowserRouter><AiTools /></BrowserRouter>);
    fireEvent.click(screen.getByTestId('tab-competitors'));
    await waitFor(() => {
      expect(screen.getByTestId('comp-form')).toBeInTheDocument();
    });
    expect(screen.getByTestId('comp-your-site')).toBeInTheDocument();
    expect(screen.getByTestId('comp-submit')).toBeInTheDocument();
  });

  test('competitors tab has 3 competitor inputs', async () => {
    render(<BrowserRouter><AiTools /></BrowserRouter>);
    fireEvent.click(screen.getByTestId('tab-competitors'));
    await waitFor(() => {
      expect(screen.getByTestId('comp-input-0')).toBeInTheDocument();
      expect(screen.getByTestId('comp-input-1')).toBeInTheDocument();
      expect(screen.getByTestId('comp-input-2')).toBeInTheDocument();
    });
  });
});
