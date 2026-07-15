// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';

// Global mock for ThemeContext — all components use useTheme()
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ dark: false, toggle: jest.fn() }),
  ThemeProvider: ({ children }) => children,
}));

// Global mock for react-helmet-async — jsdom document.head can be undefined
jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }) => children || null,
  HelmetProvider: ({ children }) => children,
}));
