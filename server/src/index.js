import './config/env.js'


import app from './app.js';
import connectDB from './config/db.js';
import { verifyConnection } from './config/nodemailer.js';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
await connectDB();

// Verify email connection
await verifyConnection();

// Start Express Server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown on SIGTERM
process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});

// Handle graceful shutdown on SIGINT (Ctrl+C local dev)
process.on('SIGINT', () => {
  server.close(() => {
    process.exit(0);
  });
});
