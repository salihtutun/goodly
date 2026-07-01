// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';

// Polyfill TextEncoder/TextDecoder for react-router v7 in Node test environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Global mock for ThemeContext — all components use useTheme()
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ dark: false, toggle: jest.fn() }),
  ThemeProvider: ({ children }) => children,
}));
