const { db } = require('../../config/database');

const createWhereClause = (filters) => {
  const { startDate, endDate, userId, scope } = filters;
  let conditions = ['is_deleted = 0'];
  let values = [];

  if (scope === 'personal' && userId) {
    conditions.push('user_id = ?');
    values.push(userId);
  }

  if (startDate) {
    conditions.push('date >= ?');
    values.push(startDate);
  }

  if (endDate) {
    conditions.push('date <= ?');
    values.push(endDate);
  }

  return {
    whereClause: `WHERE ${conditions.join(' AND ')}`,
    values,
  };
};

const getSummary = (filters = {}) => {
  const { whereClause, values } = createWhereClause(filters);

  // Total income
  const incomeResult = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM financial_records
    ${whereClause} AND type = 'income'
  `).get(...values);

  // Total expenses
  const expenseResult = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM financial_records
    ${whereClause} AND type = 'expense'
  `).get(...values);

  // Total records count
  const countResult = db.prepare(`
    SELECT COUNT(*) as total
    FROM financial_records
    ${whereClause}
  `).get(...values);

  const totalIncome = incomeResult.total;
  const totalExpenses = expenseResult.total;
  const netBalance = totalIncome - totalExpenses;

  return {
    totalIncome,
    totalExpenses,
    netBalance,
    totalRecords: countResult.total,
    scope: filters.scope || 'company',
  };
};

const getCategoryTotals = (filters = {}) => {
  const { whereClause, values } = createWhereClause(filters);

  const categories = db.prepare(`
    SELECT 
      category,
      type,
      COALESCE(SUM(amount), 0) as total,
      COUNT(*) as count
    FROM financial_records
    ${whereClause}
    GROUP BY category, type
    ORDER BY total DESC
  `).all(...values);

  // Group by category
  const grouped = {};
  categories.forEach(row => {
    if (!grouped[row.category]) {
      grouped[row.category] = {
        category: row.category,
        income: 0,
        expense: 0,
        count: 0,
      };
    }
    grouped[row.category][row.type] += row.total;
    grouped[row.category].count += row.count;
  });

  return {
    categories: Object.values(grouped),
    scope: filters.scope || 'company',
  };
};

const getMonthlyTrends = (filters = {}) => {
  const { whereClause, values } = createWhereClause(filters);

  const trends = db.prepare(`
    SELECT
      strftime('%Y-%m', date) as month,
      type,
      COALESCE(SUM(amount), 0) as total,
      COUNT(*) as count
    FROM financial_records
    ${whereClause}
    GROUP BY month, type
    ORDER BY month ASC
  `).all(...values);

  // Group by month
  const grouped = {};
  trends.forEach(row => {
    if (!grouped[row.month]) {
      grouped[row.month] = {
        month: row.month,
        income: 0,
        expense: 0,
        netBalance: 0,
        count: 0,
      };
    }
    grouped[row.month][row.type] += row.total;
    grouped[row.month].count += row.count;
  });

  // Calculate net balance per month
  Object.values(grouped).forEach(month => {
    month.netBalance = month.income - month.expense;
  });

  return {
    trends: Object.values(grouped),
    scope: filters.scope || 'company',
  };
};

const getWeeklyTrends = (filters = {}) => {
  const { whereClause, values } = createWhereClause(filters);

  const trends = db.prepare(`
    SELECT
      strftime('%Y-%W', date) as week,
      type,
      COALESCE(SUM(amount), 0) as total,
      COUNT(*) as count
    FROM financial_records
    ${whereClause}
    GROUP BY week, type
    ORDER BY week ASC
  `).all(...values);

  // Group by week
  const grouped = {};
  trends.forEach(row => {
    if (!grouped[row.week]) {
      grouped[row.week] = {
        week: row.week,
        income: 0,
        expense: 0,
        netBalance: 0,
        count: 0,
      };
    }
    grouped[row.week][row.type] += row.total;
    grouped[row.week].count += row.count;
  });

  // Calculate net balance per week
  Object.values(grouped).forEach(week => {
    week.netBalance = week.income - week.expense;
  });

  return {
    trends: Object.values(grouped),
    scope: filters.scope || 'company',
  };
};

const getRecentActivity = (filters = {}) => {
  const { whereClause, values } = createWhereClause(filters);
  const limit = filters.limit || 10;

  const records = db.prepare(`
    SELECT r.*, u.name as created_by
    FROM financial_records r
    JOIN users u ON r.user_id = u.id
    ${whereClause}
    ORDER BY r.created_at DESC
    LIMIT ?
  `).all(...values, limit);

  return {
    recentActivity: records,
    scope: filters.scope || 'company',
  };
};

module.exports = {
  getSummary,
  getCategoryTotals,
  getMonthlyTrends,
  getWeeklyTrends,
  getRecentActivity,
};
