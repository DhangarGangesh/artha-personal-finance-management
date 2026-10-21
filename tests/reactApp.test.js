const request = require('supertest');
const createApp = require('../backend/app');

describe('React Frontend SPA Integration', () => {
  const app = createApp();

  test('serves React app at root "/" with root element and bundle', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('<div id="root"></div>');
    expect(res.text).toContain('ARTHA');
  });

  test.each(['/dashboard', '/transactions', '/budgets', '/goals', '/analytics', '/trends', '/alerts'])(
    'serves React SPA for user route %s',
    async (route) => {
      const res = await request(app).get(route);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain('<div id="root"></div>');
    }
  );

  test.each(['/admin', '/admin/users', '/admin/monitoring', '/admin/audit-logs', '/admin/security', '/admin/datasets', '/admin/settings'])(
    'serves React SPA for admin route %s',
    async (route) => {
      const res = await request(app).get(route);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain('<div id="root"></div>');
    }
  );

  test('unknown page returns 404', async () => {
    const res = await request(app).get('/unknown-random-route');
    expect(res.status).toBe(404);
  });
});
