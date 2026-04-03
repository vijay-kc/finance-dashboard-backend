const { getAllUsers, getUserById, updateUser, deleteUser } = require('./users.service');
const { successResponse, errorResponse } = require('../../utils/response');

const getUsers = (req, res) => {
  try {
    const users = getAllUsers();
    return successResponse(res, 'Users fetched successfully', users);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const getUser = (req, res) => {
  try {
    const user = getUserById(req.params.id);
    return successResponse(res, 'User fetched successfully', user);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const updateUserHandler = (req, res) => {
  try {
    const user = updateUser(req.user, req.params.id, req.body);
    return successResponse(res, 'User updated successfully', user);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const deleteUserHandler = (req, res) => {
  try {
    const result = deleteUser(req.user, req.params.id);
    return successResponse(res, result.message);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

module.exports = { getUsers, getUser, updateUserHandler, deleteUserHandler };