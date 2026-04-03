const request = require("supertest");
const app = require("../src/app");
const { db, initializeDatabase } = require("../src/config/database");

// Initialize database before tests
beforeAll(() => {
  initializeDatabase();
  db.prepare(`DELETE FROM users WHERE email LIKE 'auth_test_%'`).run();
});

afterEach(() => {
  db.prepare(`DELETE FROM users WHERE email LIKE 'auth_test_%'`).run();
});

describe("Auth Module", () => {
  // Sign Up Tests

  describe("POST /api/auth/register", () => {
    it("should register as viewer if admin role requested without secret key", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test Admin2",
        email: "auth_test_testadmin2@example.com",
        password: "Password123",
        role: "admin",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.role).toBe("viewer");
    });

    it("should register a user as analyst when role is provided", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test Analyst",
        email: "auth_test_testanalyst@example.com",
        password: "Password123",
        role: "analyst",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.role).toBe("analyst");
    });

    it("should register as viewer if admin role requested without secret key", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test Admin",
        email: "auth_test_testadmin@example.com",
        password: "Password123",
        role: "admin",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.role).toBe("viewer");
    });

    it("should register as admin if correct secret key is provided", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test Admin",
        email: "auth_test_testadmin@example.com",
        password: "Password123",
        role: "admin",
        adminSecretKey: process.env.ADMIN_SECRET_KEY,
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.role).toBe("admin");
    });

    it("should return 400 if email is already registered", async () => {
      // Register first time
      await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "auth_test_test@example.com",
        password: "Password123",
      });

      // Register again with same email
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "auth_test_test@example.com",
        password: "Password123",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Email already registered");
    });

    it("should return 400 if required fields are missing", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "auth_test_test@example.com",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 if email format is invalid", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "invalid-email",
        password: "Password123",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 if password is too weak", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "auth_test_test@example.com",
        password: "123",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  //  Login Tests 

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Create a test user before each login test
      await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "auth_test_test@example.com",
        password: "Password123",
      });
    });

    it("should login successfully with correct credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "auth_test_test@example.com",
        password: "Password123",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe("auth_test_test@example.com");
    });

    it("should return 401 with wrong password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "auth_test_test@example.com",
        password: "WrongPassword123",
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid email or password");
    });

    it("should return 401 with wrong email", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "auth_test_wrong@example.com",
        password: "Password123",
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 if email or password is missing", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "auth_test_test@example.com",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
