 
const app = require('./src/app');
const { initializeDatabase } = require('./src/config/database');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 3000;

// Initialize database first then start server
initializeDatabase();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});