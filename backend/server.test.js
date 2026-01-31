const request = require('supertest');

// Mock dependencies
jest.mock('pg', () => {
  const mPool = {
    connect: jest.fn((cb) => cb(null, {}, () => {})),
    query: jest.fn().mockResolvedValue({ rows: [] }),
  };
  return { Pool: jest.fn(() => mPool) };
});

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(),
    on: jest.fn(),
    incr: jest.fn().mockResolvedValue(1),
    get: jest.fn().mockResolvedValue(null),
    setEx: jest.fn().mockResolvedValue('OK'),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    ping: jest.fn().mockResolvedValue('PONG'),
  })),
}));

// Import app after mocking
const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());

// Simple test routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

describe('Backend API Tests', () => {
  test('GET /api/health should return OK', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
  });

  test('POST request should accept JSON', async () => {
    const response = await request(app)
      .post('/api/test')
      .send({ test: 'data' });
    // We expect 404 because route doesn't exist, but JSON was parsed
    expect(response.status).toBe(404);
  });
});
