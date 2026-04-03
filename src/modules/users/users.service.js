const { db } = require('../../config/database');

const getAllUsers = () => {
  const users = db.prepare(`
    SELECT id, name, email, role, status, created_at, updated_at
    FROM users
    ORDER BY created_at DESC
  `).all();

  return users;
};

const getUserById = (id) => {
  const user = db.prepare(`
    SELECT id, name, email, role, status, created_at, updated_at
    FROM users
    WHERE id = ?
  `).get(id);

  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  return user;
};

const updateUser = (currentUser, targetId, updates) => {
  // Check if target user exists
  const targetUser = db.prepare(`
    SELECT * FROM users WHERE id = ?
  `).get(targetId);

  if (!targetUser) {
    throw { status: 404, message: 'User not found' };
  }

  // Admin cannot update another admin
  if (targetUser.role === 'admin' && currentUser.id !== targetUser.id) {
    throw { status: 403, message: 'You cannot modify another admin user' };
  }

  // Admin cannot change another admin role
  if (updates.role === 'admin' && targetUser.role !== 'admin') {
    // Check admin secret key
    if (!updates.adminSecretKey || updates.adminSecretKey !== process.env.ADMIN_SECRET_KEY) {
      throw { status: 403, message: 'Invalid admin secret key to assign admin role' };
    }
  }

  // Build update query dynamically
  const allowedFields = ['name', 'role', 'status'];
  const fieldsToUpdate = [];
  const values = [];

  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      fieldsToUpdate.push(`${field} = ?`);
      values.push(updates[field]);
    }
  });

  if (fieldsToUpdate.length === 0) {
    throw { status: 400, message: 'No valid fields to update' };
  }

  // Add updated_at
  fieldsToUpdate.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(targetId);

  db.prepare(`
    UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE id = ?
  `).run(...values);

  // Return updated user
  const updatedUser = db.prepare(`
    SELECT id, name, email, role, status, created_at, updated_at
    FROM users WHERE id = ?
  `).get(targetId);

  return updatedUser;
};

const deleteUser = (currentUser, targetId) => {
  // Cannot delete yourself
  if (currentUser.id === targetId) {
    throw { status: 400, message: 'You cannot deactivate your own account' };
  }

  // Check if target user exists
  const targetUser = db.prepare(`
    SELECT * FROM users WHERE id = ?
  `).get(targetId);

  if (!targetUser) {
    throw { status: 404, message: 'User not found' };
  }

  // Cannot deactivate another admin
  if (targetUser.role === 'admin') {
    throw { status: 403, message: 'You cannot deactivate another admin user' };
  }

  // Soft deactivate
  db.prepare(`
    UPDATE users SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(targetId);

  return { message: 'User deactivated successfully' };
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };