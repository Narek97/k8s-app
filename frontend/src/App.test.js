import { render, screen, waitFor, act } from '@testing-library/react';
import App from './App';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockClear();
  mockFetch.mockResolvedValue({
    json: () => Promise.resolve({ data: [], pod_name: 'test-pod', source: 'test' }),
  });
});

test('renders app title', async () => {
  await act(async () => {
    render(<App />);
  });

  const titleElement = screen.getByText(/Advanced Kubernetes App/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders add item button', async () => {
  await act(async () => {
    render(<App />);
  });

  await waitFor(() => {
    const buttonElement = screen.getByText(/Add Item/i);
    expect(buttonElement).toBeInTheDocument();
  });
});
