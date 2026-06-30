// AppLayout, VisibilityTile, and Dashboard component smoke tests.

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

// Mock @/lib/api at the exact filesystem path
const visibilityData = {
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
const summaryData = { projects_count: 0, audits_count: 0, average_score: null, recent_audits: [] };

jest.mock('/Users/salihtutun/Downloads/goodly-main/frontend/src/lib/api', () => {
  const mockApi = {
    get: jest.fn((url) => {
      if (url === '/dashboard/visibility') return Promise.resolve({ data: visibilityData });
      if (url === '/dashboard/summary') return Promise.resolve({ data: summaryData });
      if (url === '/projects') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: {} });
    }),
    post: jest.fn().mockResolvedValue({ data: {} }),
  };
  return {
    __esModule: true,
    default: mockApi,
    formatApiError: jest.fn((e) => 'API error'),
  };
});

import Dashboard from '../pages/Dashboard';
import AppLayout from '../components/app/AppLayout';
import VisibilityTile from '../components/app/VisibilityTile';

describe('Dashboard Page', () => {
  test('renders without crashing', async () => {
    render(<BrowserRouter><Dashboard /></BrowserRouter>);
    await new Promise(r => setTimeout(r, 200));
    expect(screen.getByTestId('dashboard-root')).toBeInTheDocument();
  });

  test('shows visibility tile', async () => {
    render(<BrowserRouter><Dashboard /></BrowserRouter>);
    await new Promise(r => setTimeout(r, 200));
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
  test('renders with data', async () => {
    render(<BrowserRouter><VisibilityTile /></BrowserRouter>);
    await new Promise(r => setTimeout(r, 200));
    expect(screen.getByTestId('visibility-tile')).toBeInTheDocument();
  });
});
