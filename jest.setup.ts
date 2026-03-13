import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn()
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    set: jest.fn()
  })
}));

// Mock next/headers since it's server-side only
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn()
  }),
  headers: () => ({
    get: jest.fn(),
    set: jest.fn()
  })
}));

// Suppress console errors during tests
global.console.error = jest.fn();

// Mock ResizeObserver (used by Tags component)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
