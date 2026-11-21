const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const postsRouter = require('./routes/posts');

const app = express();

// CORS_ORIGIN can be "*" or a comma-separated list of allowed origins
const origins = (process.env.CORS_ORIGIN || '*').split(',').map((o) => o.trim());
app.use(cors({ origin: origins.includes('*') ? '*' : origins }));
app.use(express.json());

app.get('/', (_req, res) => res.send('MERN Blog API is running'));

app.get('/api/v1/health', (_req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({ status: 'ok', database: states[mongoose.connection.readyState] || 'unknown' });
});

app.use('/api/v1/posts', postsRouter);

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// Central error handler
app.use((err, _req, res, _next) => {
  if (err.name === 'ValidationError') return res.status(400).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
