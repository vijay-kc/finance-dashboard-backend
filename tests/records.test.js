const request = require('supertest');
const app = require('../src/app');
const { db, initializeDatabase } = require('../src/config/database');

const tokens = {
  admin: null,
  analyst: null,
  viewer: null,
};

let recordId;

const cleanupTestData = () => {
  // First get test user ids
  const testUsers = db.prepare(`
    SELECT id FROM users WHERE email LIKE 'records_test_%'
  `).all();

  if (testUsers.length > 0) {
    const ids = testUsers.map(u => `'${u.id}'`).join(',');
    // Delete their records first
    db.prepare(`DELETE FROM financial_records WHERE user_id IN (${ids})`).run();
  }

  // Also delete by category just in case
  db.prepare(`DELETE FROM financial_records WHERE category = 'TestCategory'`).run();

  // Now safe to delete users
  db.prepare(`DELETE FROM users WHERE email LIKE 'records_test_%'`).run();
};

beforeAll(async () => {
  initializeDatabase();
  cleanupTestData();

  // Register and login admin
  await request(app).post('/api/auth/register').send({
    name: 'Records Test Admin',
    email: 'records_test_admin@example.com',
    password: 'Password123',
    role: 'admin',
    adminSecretKey: process.env.ADMIN_SECRET_KEY,
  });
  const adminLogin = await request(app).post('/api/auth/login').send({
    email: 'records_test_admin@example.com',
    password: 'Password123',
  });
  tokens.admin = adminLogin.body.data.token;

  // Register and login analyst
  await request(app).post('/api/auth/register').send({
    name: 'Records Test Analyst',
    email: 'records_test_analyst@example.com',
    password: 'Password123',
    role: 'analyst',
  });
  const analystLogin = await request(app).post('/api/auth/login').send({
    email: 'records_test_analyst@example.com',
    password: 'Password123',
  });
  tokens.analyst = analystLogin.body.data.token;

  // Register and login viewer
  await request(app).post('/api/auth/register').send({
    name: 'Records Test Viewer',
    email: 'records_test_viewer@example.com',
    password: 'Password123',
    role: 'viewer',
  });
  const viewerLogin = await request(app).post('/api/auth/login').send({
    email: 'records_test_viewer@example.com',
    password: 'Password123',
  });
  tokens.viewer = viewerLogin.body.data.token;
});

afterAll(() => {
  cleanupTestData();
});

describe('Records Module', () => {

  describe('POST /api/records', () => {

    it('should create a record as admin', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          amount: 5000,
          type: 'income',
          category: 'TestCategory',
          date: '2026-04-01',
          notes: 'test record',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(5000);
      expect(res.body.data.type).toBe('income');
      recordId = res.body.data.id;
    });

    it('should return 403 if analyst tries to create a record', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${tokens.analyst}`)
        .send({
          amount: 5000,
          type: 'income',
          category: 'TestCategory',
          date: '2026-04-01',
          notes: 'test record',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 if viewer tries to create a record', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${tokens.viewer}`)
        .send({
          amount: 5000,
          type: 'income',
          category: 'TestCategory',
          date: '2026-04-01',
          notes: 'test record',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 if amount is missing', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          type: 'income',
          category: 'TestCategory',
          date: '2026-04-01',
          notes: 'test record',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 if type is invalid', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          amount: 5000,
          type: 'invalid',
          category: 'TestCategory',
          date: '2026-04-01',
          notes: 'test record',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 if date format is invalid', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          amount: 5000,
          type: 'income',
          category: 'TestCategory',
          date: '01-04-2026',
          notes: 'test record',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 if amount is negative', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          amount: -5000,
          type: 'income',
          category: 'TestCategory',
          date: '2026-04-01',
          notes: 'test record',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

  });

  describe('GET /api/records', () => {

    it('should get all records as admin', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${tokens.admin}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.records).toBeDefined();
      expect(res.body.data.pagination).toBeDefined();
    });

    it('should get all records as analyst', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${tokens.analyst}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 403 if viewer tries to get records', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${tokens.viewer}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should filter records by type', async () => {
      const res = await request(app)
        .get('/api/records?type=income')
        .set('Authorization', `Bearer ${tokens.admin}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.records.every(r => r.type === 'income')).toBe(true);
    });

    it('should return paginated results', async () => {
      const res = await request(app)
        .get('/api/records?page=1&limit=2')
        .set('Authorization', `Bearer ${tokens.admin}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.records.length).toBeLessThanOrEqual(2);
      expect(res.body.data.pagination.limit).toBe(2);
    });

  });

  describe('PATCH /api/records/:id', () => {

    it('should update a record as admin', async () => {
      const res = await request(app)
        .patch(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ amount: 9000 });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.amount).toBe(9000);
    });

    it('should return 403 if analyst tries to update a record', async () => {
      const res = await request(app)
        .patch(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${tokens.analyst}`)
        .send({ amount: 9000 });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 if record does not exist', async () => {
      const res = await request(app)
        .patch(`/api/records/non-existent-id`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ amount: 9000 });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

  });

  describe('DELETE /api/records/:id', () => {

    it('should soft delete a record as admin', async () => {
      const res = await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${tokens.admin}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 if record is already deleted', async () => {
      const res = await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${tokens.admin}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 if analyst tries to delete a record', async () => {
      const res = await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${tokens.analyst}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

  });

});