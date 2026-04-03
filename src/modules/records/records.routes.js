const express = require('express');
const router = express.Router();
const { create, getAll, getOne, update, remove } = require('./records.controller');
const { authenticate } = require('../../middleware/auth');
const { isAdmin, isAnalyst } = require('../../middleware/role');

// Create record - Admin only
router.post('/', authenticate, isAdmin, create);

// Get all records - Analyst and Admin
router.get('/', authenticate, isAnalyst, getAll);

// Get single record - Analyst and Admin
router.get('/:id', authenticate, isAnalyst, getOne);

// Update record - Admin only
router.patch('/:id', authenticate, isAdmin, update);

// Delete record - Admin only
router.delete('/:id', authenticate, isAdmin, remove);

module.exports = router;