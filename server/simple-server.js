/**
 * Simple Development Server
 * Bypasses authentication for testing purposes
 */

import express from 'express';
import cors from 'cors';
import { dataValidator } from './utils/data-validator.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Load sample data
const sampleData = JSON.parse(
  readFileSync(join(__dirname, '../data/sample-data.json'), 'utf-8')
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

// Get sample data
app.get('/api/data', (req, res) => {
  res.json(sampleData);
});

// Get specific lab test
app.get('/api/labs/:testName', (req, res) => {
  const test = sampleData.labTests[req.params.testName];
  if (test) {
    res.json(test);
  } else {
    res.status(404).json({ error: 'Lab test not found' });
  }
});

// Serve static files from client
app.use(express.static(join(__dirname, '../client/.next')));

app.listen(PORT, () => {
  console.log(`\n🚀 Simple Dev Server running on http://localhost:${PORT}`);
  console.log(`📊 Sample data available at http://localhost:${PORT}/api/data`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET /health`);
  console.log(`   GET /api/data`);
  console.log(`   GET /api/labs/:testName`);
  console.log(`\n`);
});

export default app;
