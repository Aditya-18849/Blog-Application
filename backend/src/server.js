require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/blog';

async function start() {
  try {
    await mongoose.connect(DATABASE_URL);
    console.info('Connected to MongoDB');
    app.listen(PORT, '0.0.0.0', () => console.info(`Express server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

start();
