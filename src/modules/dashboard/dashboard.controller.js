const {
  getSummary,
  getCategoryTotals,
  getMonthlyTrends,
  getWeeklyTrends,
  getRecentActivity,
} = require('./dashboard.service');
const { successResponse, errorResponse } = require('../../utils/response');

const buildFilters = (query, userId) => {
  const { startDate, endDate, scope } = query;
  return {
    startDate,
    endDate,
    scope: scope || 'company',
    userId,
  };
};

const summary = (req, res) => {
  try {
    const filters = buildFilters(req.query, req.user.id);
    const data = getSummary(filters);
    return successResponse(res, 'Summary fetched successfully', data);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const byCategory = (req, res) => {
  try {
    const filters = buildFilters(req.query, req.user.id);
    const data = getCategoryTotals(filters);
    return successResponse(res, 'Category totals fetched successfully', data);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const monthlyTrends = (req, res) => {
  try {
    const filters = buildFilters(req.query, req.user.id);
    const data = getMonthlyTrends(filters);
    return successResponse(res, 'Monthly trends fetched successfully', data);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const weeklyTrends = (req, res) => {
  try {
    const filters = buildFilters(req.query, req.user.id);
    const data = getWeeklyTrends(filters);
    // console.log('data', data);
    return successResponse(res, 'Weekly trends fetched successfully', data);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const recentActivity = (req, res) => {
  try {
    const filters = buildFilters(req.query, req.user.id);
    filters.limit = req.query.limit || 10;
    // console.log('filters', filters);
    const data = getRecentActivity(filters);

    return successResponse(res, 'Recent activity fetched successfully', data);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

module.exports = { summary, byCategory, monthlyTrends, weeklyTrends, recentActivity };