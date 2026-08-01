import './config/env.js'

import app from './app.js';
import connectDB from './config/db.js';
import { verifyConnection } from './config/nodemailer.js';

const PORT = process.env.PORT || 5000;

await connectDB();


const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

verifyConnection().catch((err) => {
  console.error('Email service verification failed at startup:', err.message);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});