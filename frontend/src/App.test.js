import { render, screen } from '@testing-library/react';
import App from './App';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: [], pod_name: 'test-pod', source: 'test' }),
  })
);

test('renders app title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Advanced Kubernetes App/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders add item button', () => {
  render(<App />);
  const buttonElement = screen.getByText(/Add Item/i);
  expect(buttonElement).toBeInTheDocument();
});
