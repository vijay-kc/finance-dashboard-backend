const { createRecord, getAllRecords, getRecordById, updateRecord, deleteRecord } = require('./records.service');
const { successResponse, errorResponse } = require('../../utils/response');
// create a new record
const create = (req, res) => {
  try {
    const record = createRecord(req.user.id, req.body);
    return successResponse(res, 'Record created successfully', record, 201);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};
// get all records with optional filters and pagination
const getAll = (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      category: req.query.category,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      userId: req.query.userId,
    };

    const pagination = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
    };

    const result = getAllRecords(filters, pagination);
    return successResponse(res, 'Records fetched successfully', result);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};
// get a single record by id
const getOne = (req, res) => {
  try {
    const record = getRecordById(req.params.id);
    return successResponse(res, 'Record fetched successfully', record);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};
// update a record by id
const update = (req, res) => {
  try {
    const record = updateRecord(req.params.id, req.body);
    return successResponse(res, 'Record updated successfully', record);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};
// delete a record by id (soft delete)
const remove = (req, res) => {
  try {
    const result = deleteRecord(req.params.id);
    return successResponse(res, result.message);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

module.exports = { create, getAll, getOne, update, remove };