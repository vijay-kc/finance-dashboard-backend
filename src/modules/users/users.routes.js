const express = require('express');
const router = express.Router();
const { getUsers, getUser, updateUserHandler, deleteUserHandler } = require('./users.controller');
const { authenticate } = require('../../middleware/auth');
const { isAdmin } = require('../../middleware/role');

// All routes require authentication and admin role
router.get('/', authenticate, isAdmin, getUsers);
router.get('/:id', authenticate, isAdmin, getUser);
router.patch('/:id', authenticate, isAdmin, updateUserHandler);
router.delete('/:id', authenticate, isAdmin, deleteUserHandler);

module.exports = router;