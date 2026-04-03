const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../../config/database');
const { validateEmail, validatePassword, validateRole } = require('../../utils/validators');

const registerUser = (name, email, password, role, adminSecretKey) => {
  // Validate inputs
  if (!name || !email || !password) {
    throw { status: 400, message: 'Name, email and password are required' };
  }
  if (!validateEmail(email)) {
    throw { status: 400, message: 'Invalid email format' };
  }
  if (!validatePassword(password)) {
    throw { status: 400, message: 'Password must be at least 8 characters and contain at least one letter and one number' };
  }
  // Determine role
  let assignedRole = 'viewer';

  if (role && validateRole(role)) {
    if (role === 'admin') {
      // Check admin secret key
      if (!adminSecretKey || adminSecretKey !== process.env.ADMIN_SECRET_KEY) {
        assignedRole = 'viewer';
      } else {
        assignedRole = 'admin';
      }
    } else {
      assignedRole = role;
    }
  }

  //check email already exists
  const existingUser = db.prepare(`
    SELECT id FROM users WHERE email = ?
  `).get(email);

  if (existingUser) {
    throw { status: 400, message: 'Email already registered' };
  }

  // Hash password
  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = uuidv4();

  // Insert user
  db.prepare(`
    INSERT INTO users (id, name, email, password, role, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, email, hashedPassword, assignedRole, 'active');

  // Return created user without password
  const user = db.prepare(`
    SELECT id, name, email, role, status, created_at
    FROM users WHERE id = ?
  `).get(id);

  return user;
};

const loginUser = (email, password) => {

  // Validate inputs
  if (!email || !password) {
    throw { status: 400, message: 'Email and password are required' };
  }

  if (!validateEmail(email)) {
    throw { status: 400, message: 'Invalid email format' };
  }

  // Find user
  const user = db.prepare(`
    SELECT * FROM users WHERE email = ?
  `).get(email);

  if (!user) {
    throw { status: 401, message: 'Invalid email or password' };
  }

  if (user.status === 'inactive') {
    throw { status: 401, message: 'Your account has been deactivated' };
  }
  // Check password
  const isPasswordValid = bcrypt.compareSync(password, user.password);

  if (!isPasswordValid) {
    throw { status: 401, message: 'Invalid email or password' };
  }

  // Generate token
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  };
};

module.exports = { registerUser, loginUser };
