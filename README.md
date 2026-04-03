# Finance Dashboard Backend

A RESTful backend API for a finance dashboard system built with Node.js, Express, and SQLite. The system supports role-based access control, financial records management, and dashboard summary analytics.

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (via better-sqlite3)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Testing**: Jest + Supertest

---

---

## Rate Limiting

| Route          | Limit                          |
|----------------|--------------------------------|
| All routes     | 100 requests per 15 minutes    |
| Auth routes    | 10 requests per 15 minutes     |

--- 

## Project Structure

```
finance-dashboard-backend/
├── src/
│   ├── config/
│   │   └── database.js        # Database initialization and seed
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication middleware
│   │   └── role.js            # Role based access control middleware
│   ├── modules/
│   │   ├── auth/              # Register and login
│   │   ├── users/             # User management
│   │   ├── records/           # Financial records CRUD
│   │   └── dashboard/         # Summary and analytics APIs
│   ├── utils/
│   │   ├── response.js        # Standardized response helpers
│   │   └── validators.js      # Input validation helpers
│   └── app.js                 # Express app setup
├── tests/
│   ├── auth.test.js           # Auth module unit tests
│   └── records.test.js        # Records module unit tests
├── server.js                  # Server entry point
├── jest.config.js             # Jest configuration
├── .env.example               # Environment variables template
└── README.md
```

---

## Setup Instructions

### 1. Clone the repository
```bash
git clone <repository-url>
cd finance-dashboard-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
```bash
cp .env.example .env
```

Generate JWT secret key:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Generate Admin secret key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Update `.env` with the generated keys:
```
PORT=3000
JWT_SECRET=your_generated_jwt_secret
ADMIN_SECRET_KEY=your_generated_admin_secret
ADMIN_DEFAULT_PASSWORD=Admin@123
```

### 4. Start the server
```bash
# Development
npm run dev

# Production
npm start
```

### 5. Run tests
```bash
npm test
```

---

## Default Admin Credentials

A default admin user is automatically created on first startup:

| Field    | Value               |
|----------|---------------------|
| Email    | admin@finance.com   |
| Password | Admin@123           |
| Role     | admin               |

> Change the default password after first login in production.

---

## Role Permission Matrix

| Action                        | Viewer | Analyst | Admin |
|-------------------------------|--------|---------|-------|
| Register / Login              | ✅     | ✅      | ✅    |
| View dashboard summary        | ✅     | ✅      | ✅    |
| View category totals          | ✅     | ✅      | ✅    |
| View monthly trends           | ✅     | ✅      | ✅    |
| View weekly trends            | ✅     | ✅      | ✅    |
| View recent activity          | ✅     | ✅      | ✅    |
| View financial records        | ❌     | ✅      | ✅    |
| Create financial records      | ❌     | ❌      | ✅    |
| Update financial records      | ❌     | ❌      | ✅    |
| Delete financial records      | ❌     | ❌      | ✅    |
| View all users                | ❌     | ❌      | ✅    |
| Update user role/status       | ❌     | ❌      | ✅    |
| Deactivate users              | ❌     | ❌      | ✅    |

---

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Standard Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

---

### Auth Endpoints

#### Register
```
POST /api/auth/register
```
Request body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "role": "viewer",
  "adminSecretKey": "optional - only required for admin role"
}
```

Rules:
- Default role is `viewer` if not provided
- To register as `admin`, a valid `adminSecretKey` must be provided
- If admin role is requested without a valid key, role defaults to `viewer`

---

#### Login
```
POST /api/auth/login
```
Request body:
```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```
Response includes a JWT token valid for 24 hours.

---

### User Endpoints (Admin only)

#### Get All Users
```
GET /api/users
Authorization: Bearer <token>
```

#### Get Single User
```
GET /api/users/:id
Authorization: Bearer <token>
```

#### Update User
```
PATCH /api/users/:id
Authorization: Bearer <token>
```
Request body:
```json
{
  "role": "analyst",
  "status": "inactive"
}
```

Rules:
- Admin cannot modify another admin's role
- To promote a user to admin, `adminSecretKey` must be provided

#### Deactivate User
```
DELETE /api/users/:id
Authorization: Bearer <token>
```

Rules:
- Admin cannot deactivate another admin
- Admin cannot deactivate their own account

---

### Financial Records Endpoints

#### Create Record (Admin only)
```
POST /api/records
Authorization: Bearer <token>
```
Request body:
```json
{
  "amount": 50000,
  "type": "income",
  "category": "Salary",
  "date": "2026-04-01",
  "notes": "Monthly salary"
}
```

#### Get All Records (Analyst + Admin)
```
GET /api/records
Authorization: Bearer <token>
```

Query parameters:
| Parameter  | Description                         | Example                     |
|------------|-------------------------------------|-----------------------------|
| type       | Filter by type (comma separated)    | ?type=income,expense        |
| category   | Filter by category (comma separated)| ?category=Food,Transport    |
| startDate  | Filter from date (YYYY-MM-DD)       | ?startDate=2026-01-01       |
| endDate    | Filter to date (YYYY-MM-DD)         | ?endDate=2026-12-31         |
| userId     | Filter by creator                   | ?userId=abc123              |
| search     | Search in category and notes        | ?search=salary              |
| page       | Page number (default: 1)            | ?page=2                     |
| limit      | Records per page (default: 10)      | ?limit=5                    |

#### Get Single Record (Analyst + Admin)
```
GET /api/records/:id
Authorization: Bearer <token>
```

#### Update Record (Admin only)
```
PATCH /api/records/:id
Authorization: Bearer <token>
```
Request body (all fields optional):
```json
{
  "amount": 55000,
  "type": "income",
  "category": "Salary",
  "date": "2026-04-01",
  "notes": "Updated salary"
}
```

#### Delete Record (Admin only)
```
DELETE /api/records/:id
Authorization: Bearer <token>
```
Soft delete — record is hidden but retained in the database.

---

### Dashboard Endpoints (All roles)

All dashboard endpoints support these query parameters:

| Parameter  | Description                               | Example               |
|------------|-------------------------------------------|-----------------------|
| scope      | `personal` or `company` (default)         | ?scope=personal       |
| startDate  | Filter from date                          | ?startDate=2026-01-01 |
| endDate    | Filter to date                            | ?endDate=2026-12-31   |

#### Summary
```
GET /api/dashboard/summary
Authorization: Bearer <token>
```
Returns total income, total expenses, net balance, and total record count.

#### Category Totals
```
GET /api/dashboard/by-category
Authorization: Bearer <token>
```
Returns income and expense breakdown per category.

#### Monthly Trends
```
GET /api/dashboard/trends/monthly
Authorization: Bearer <token>
```
Returns income, expenses, and net balance grouped by month.

#### Weekly Trends
```
GET /api/dashboard/trends/weekly
Authorization: Bearer <token>
```
Returns income, expenses, and net balance grouped by week.

#### Recent Activity
```
GET /api/dashboard/recent
Authorization: Bearer <token>
```
Returns the 10 most recent financial records.

Query parameter:
| Parameter | Description                      | Example  |
|-----------|----------------------------------|----------|
| limit     | Number of records (default: 10)  | ?limit=5 |

---

## Assumptions and Tradeoffs

### Assumptions
- All financial record amounts must be positive numbers
- Dates must follow the `YYYY-MM-DD` format
- JWT tokens expire after 24 hours
- Soft deleted records are excluded from all queries and dashboard calculations
- A user with an inactive status cannot login

### Tradeoffs
- **Soft delete**: Records are never permanently deleted to maintain auditability and data integrity in a finance system.
- **Role levels**: Roles are implemented as a hierarchy (viewer=1, analyst=2, admin=3) making it easy to add new roles in the future.
- **No refresh tokens**: For simplicity, only access tokens are used. In production, refresh tokens should be added.
- **Rate limiting**: Applied globally (100 req/15min) and strictly on auth routes (10 req/15min) to prevent brute force attacks.
- **Search**: Supports keyword search across category and notes fields using SQL LIKE queries.

---

## Running Tests

```bash
npm test
```

Current test coverage:
- Auth module: 12 tests
- Records module: 18 tests
- Total: 30 tests
