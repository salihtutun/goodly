// Dashboard and AppLayout component smoke tests.

import React from 'react';
import { render, screen, act } from '@testing-library/react';
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

// Mock the api module at the exact path Jest resolves @/lib/api to
// The craco moduleNameMapper maps @/(.*) → <rootDir>/src/$1
// So @/lib/api → <rootDir>/src/lib/api
jest.mock('<rootDir>/src/lib/api', () => ({
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
    await act(async () => {
      render(<BrowserRouter><Dashboard /></BrowserRouter>);
    });
    expect(screen.getByTestId('dashboard-root')).toBeInTheDocument();
  });

  test('shows visibility tile', async () => {
    await act(async () => {
      render(<BrowserRouter><Dashboard /></BrowserRouter>);
    });
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
