const { db } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');
const { validateAmount, validateType } = require('../../utils/validators');

const createRecord = (userId, data) => {
  const { amount, type, category, date, notes } = data;

  // Validate inputs
  if (!amount || !type || !category || !date) {
    throw { status: 400, message: 'Amount, type, category and date are required' };
  }

  if (!validateAmount(amount)) {
    throw { status: 400, message: 'Amount must be a positive number' };
  }

  if (!validateType(type)) {
    throw { status: 400, message: 'Type must be either income or expense' };
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw { status: 400, message: 'Date must be in YYYY-MM-DD format' };
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO financial_records (id, user_id, amount, type, category, date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, parseFloat(amount), type, category, date, notes || null);

  const record = db.prepare(`
    SELECT r.*, u.name as created_by
    FROM financial_records r
    JOIN users u ON r.user_id = u.id
    WHERE r.id = ?
  `).get(id);

  return record;
};

const getAllRecords = (filters = {}, pagination = {}) => {
  const {
    type,
    category,
    startDate,
    endDate,
    userId,
  } = filters;

  const { page = 1, limit = 10 } = pagination;
  const offset = (page - 1) * limit;

  // Build query dynamically
  let conditions = ['r.is_deleted = 0'];
  let values = [];

  if (type) {
    const types = type.split(',').map(t => t.trim());
    conditions.push(`r.type IN (${types.map(() => '?').join(',')})`);
    values.push(...types);
  }

  if (category) {
    const categories = category.split(',').map(c => c.trim());
    conditions.push(`r.category IN (${categories.map(() => '?').join(',')})`);
    values.push(...categories);
  }

  if (startDate) {
    conditions.push(`r.date >= ?`);
    values.push(startDate);
  }

  if (endDate) {
    conditions.push(`r.date <= ?`);
    values.push(endDate);
  }

  if (userId) {
    conditions.push(`r.user_id = ?`);
    values.push(userId);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  // Get total count
  const totalCount = db.prepare(`
    SELECT COUNT(*) as count
    FROM financial_records r
    ${whereClause}
  `).get(...values).count;

  // Get records
  const records = db.prepare(`
    SELECT r.*, u.name as created_by
    FROM financial_records r
    JOIN users u ON r.user_id = u.id
    ${whereClause}
    ORDER BY r.date DESC, r.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...values, limit, offset);

  return {
    records,
    pagination: {
      total: totalCount,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};

const getRecordById = (id) => {
  const record = db.prepare(`
    SELECT r.*, u.name as created_by
    FROM financial_records r
    JOIN users u ON r.user_id = u.id
    WHERE r.id = ? AND r.is_deleted = 0
  `).get(id);

  if (!record) {
    throw { status: 404, message: 'Record not found' };
  }

  return record;
};

const updateRecord = (id, data) => {
  const record = db.prepare(`
    SELECT * FROM financial_records WHERE id = ? AND is_deleted = 0
  `).get(id);

  if (!record) {
    throw { status: 404, message: 'Record not found' };
  }

  const { amount, type, category, date, notes } = data;

  // Validate if provided
  if (amount && !validateAmount(amount)) {
    throw { status: 400, message: 'Amount must be a positive number' };
  }

  if (type && !validateType(type)) {
    throw { status: 400, message: 'Type must be either income or expense' };
  }

  if (date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw { status: 400, message: 'Date must be in YYYY-MM-DD format' };
    }
  }

  // Build update query dynamically
  const allowedFields = { amount, type, category, date, notes };
  const fieldsToUpdate = [];
  const values = [];

  Object.entries(allowedFields).forEach(([key, value]) => {
    if (value !== undefined) {
      fieldsToUpdate.push(`${key} = ?`);
      values.push(key === 'amount' ? parseFloat(value) : value);
    }
  });

  if (fieldsToUpdate.length === 0) {
    throw { status: 400, message: 'No valid fields to update' };
  }

  fieldsToUpdate.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  db.prepare(`
    UPDATE financial_records SET ${fieldsToUpdate.join(', ')} WHERE id = ?
  `).run(...values);

  return getRecordById(id);
};

const deleteRecord = (id) => {
  const record = db.prepare(`
    SELECT * FROM financial_records WHERE id = ? AND is_deleted = 0
  `).get(id);

  if (!record) {
    throw { status: 404, message: 'Record not found' };
  }

  db.prepare(`
    UPDATE financial_records SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(id);

  return { message: 'Record deleted successfully' };
};

module.exports = { createRecord, getAllRecords, getRecordById, updateRecord, deleteRecord };