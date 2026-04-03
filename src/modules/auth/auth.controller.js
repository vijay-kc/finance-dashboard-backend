const { registerUser, loginUser } = require("./auth.service");
const { successResponse, errorResponse } = require("../../utils/response");

const register = (req, res) => {
  try {
    const { name, email, password, role, adminSecretKey } = req.body;
    const user = registerUser(name, email, password, role, adminSecretKey);
    return successResponse(res, "User registered successfully", user, 201);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

const login = (req, res) => {
  try {
    const { email, password } = req.body;
    const data = loginUser(email, password);
    return successResponse(res, "Login successful", data);
  } catch (err) {
    return errorResponse(res, err.message, err.status || 500);
  }
};

module.exports = { register, login };
