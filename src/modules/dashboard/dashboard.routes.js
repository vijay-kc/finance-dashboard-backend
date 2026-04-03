const express = require('express');
const router = express.Router();
const {
  summary,
  byCategory,
  monthlyTrends,
  weeklyTrends,
  recentActivity,
} = require('./dashboard.controller');
const { authenticate } = require('../../middleware/auth');
const { isViewer } = require('../../middleware/role');

// All dashboard routes accessible to all roles
router.get('/summary', authenticate, isViewer, summary);
router.get('/by-category', authenticate, isViewer, byCategory);
router.get('/trends/monthly', authenticate, isViewer, monthlyTrends);
router.get('/trends/weekly', authenticate, isViewer, weeklyTrends);
router.get('/recent', authenticate, isViewer, recentActivity);

module.exports = router;