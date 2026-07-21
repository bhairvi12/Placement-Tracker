import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // use STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
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
