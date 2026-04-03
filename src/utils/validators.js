const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // Minimum 8 characters, at least one letter and one number
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
  return passwordRegex.test(password);
};

const validateRole = (role) => {
  const validRoles = ['viewer', 'analyst', 'admin'];
  return validRoles.includes(role);
};

const validateAmount = (amount) => {
  return !isNaN(amount) && parseFloat(amount) > 0;
};

const validateType = (type) => {
  const validTypes = ['income', 'expense'];
  return validTypes.includes(type);
};

module.exports = {
  validateEmail,
  validatePassword,
  validateRole,
  validateAmount,
  validateType,
};