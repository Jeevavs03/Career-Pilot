import request from 'supertest';
import app from '../../src/app';

describe('API Health Check', () => {
  it('GET /health should return ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /unknown should return 404', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.status).toBe(404);
  });
});

describe('Auth Routes', () => {
  it('POST /api/v1/auth/login without body returns error', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({});
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('GET /api/v1/auth/profile without token returns 401', async () => {
    const res = await request(app).get('/api/v1/auth/profile');
    expect(res.status).toBe(401);
  });
});

describe('Protected Routes', () => {
  it('GET /api/v1/jobs without auth returns 401', async () => {
    const res = await request(app).get('/api/v1/jobs');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/applications without auth returns 401', async () => {
    const res = await request(app).get('/api/v1/applications');
    expect(res.status).toBe(401);
  });
});
