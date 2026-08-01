import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  pool: true,             // reuse connections instead of a fresh handshake per email
  maxConnections: 3,
  connectionTimeout: 10_000,  // fail fast instead of hanging indefinitely
  greetingTimeout: 10_000,
  socketTimeout: 15_000,
});

export const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log('Email service ready');
  } catch (error) {
    console.log(`Email service verification failed: ${error.message}`);
  }
};

export default transporter;