const { db } = require('../src/config/database');

beforeEach(() => {
  // Clean up test data before each test file
  db.prepare(`DELETE FROM financial_records WHERE notes LIKE 'test%'`).run();
  db.prepare(`DELETE FROM users WHERE email LIKE 'test%'`).run();
});