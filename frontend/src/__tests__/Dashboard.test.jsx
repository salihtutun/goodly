// AppLayout and VisibilityTile component smoke tests.
// Note: Dashboard page tests are skipped because @/lib/api uses import.meta
// which Jest cannot mock through moduleNameMapper.

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock auth context
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@test.com', name: 'Test', role: 'user', plan: 'free' },
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
  }),
  AuthProvider: ({ children }) => children,
}));

// Mock @/lib/api at the exact filesystem path (jest.mock doesn't use moduleNameMapper)
jest.mock('/Users/salihtutun/Downloads/goodly-main/frontend/src/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
  },
  formatApiError: jest.fn((e) => 'API error'),
}));

import Dashboard from '../pages/Dashboard';
import AppLayout from '../components/app/AppLayout';
import VisibilityTile from '../components/app/VisibilityTile';

describe('Dashboard Page', () => {
  test('renders without crashing', async () => {
    render(<BrowserRouter><Dashboard /></BrowserRouter>);
    await new Promise(r => setTimeout(r, 100));
    expect(screen.getByTestId('dashboard-root')).toBeInTheDocument();
  });

  test('shows visibility tile', async () => {
    render(<BrowserRouter><Dashboard /></BrowserRouter>);
    await new Promise(r => setTimeout(r, 100));
    expect(screen.getByTestId('visibility-tile')).toBeInTheDocument();
  });
});

describe('AppLayout', () => {
  test('renders nav links', () => {
    render(<BrowserRouter><AppLayout /></BrowserRouter>);
    expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('nav-projects')).toBeInTheDocument();
    expect(screen.getByTestId('nav-audit')).toBeInTheDocument();
  });

  test('renders logout button', () => {
    render(<BrowserRouter><AppLayout /></BrowserRouter>);
    expect(screen.getByTestId('logout-btn')).toBeInTheDocument();
  });
});

describe('VisibilityTile', () => {
  test('renders with no data', () => {
    render(<BrowserRouter><VisibilityTile visibility={{ overall_score: null, informed_fraction: 0, breakdown: {} }} /></BrowserRouter>);
    expect(screen.getByTestId('visibility-tile')).toBeInTheDocument();
  });

  test('renders with data', () => {
    const data = {
      overall_score: 68,
      informed_fraction: 0.5,
      breakdown: {
        google: { score: 70, has_data: true },
        instagram: { score: null, has_data: false },
        tiktok: { score: null, has_data: false },
        youtube: { score: null, has_data: false },
        ai_assistants: { score: null, has_data: false },
        gbp: { score: null, has_data: false },
      },
    };
    render(<BrowserRouter><VisibilityTile visibility={data} /></BrowserRouter>);
    expect(screen.getByTestId('visibility-tile')).toBeInTheDocument();
  });
});
