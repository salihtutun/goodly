// Jest config for Goodly frontend tests

module.exports = {
  roots: ['<rootDir>/src'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx}',
  ],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx|mjs|cjs)$': 'babel-jest',
    '^.+\\.css$': '<rootDir>/config/jest/cssTransform.cjs',
  },
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\](?!(react-router|react-router-dom|@remix-run|swr|sonner|lucide-react|recharts|framer-motion|@radix-ui|@tanstack|cmdk|vaul|embla-carousel-react|input-otp|react-day-picker|react-resizable-panels|react-hook-form|@hookform|next-themes|class-variance-authority|clsx|tailwind-merge|date-fns|dayjs|axios)/).+\\.(js|jsx|mjs|cjs)$',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-router-dom$': '<rootDir>/node_modules/react-router-dom/dist/index.js',
    '^react-router$': '<rootDir>/node_modules/react-router/dist/development/index.js',
    '^react-router/dom$': '<rootDir>/node_modules/react-router/dist/development/dom-export.js',
    '\\.(css|less|scss|sass)$': '<rootDir>/config/jest/cssTransform.cjs',
  },
  setupFiles: ['<rootDir>/config/jest/setup.cjs'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  resetMocks: true,
};
