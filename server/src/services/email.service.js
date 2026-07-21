import transporter from '../config/nodemailer.js';

const EMAIL_FROM = process.env.EMAIL_FROM;

/**
 * Sends a welcome email to a new user.
 */
export const sendWelcomeEmail = async (to, fullName) => {
  const mailOptions = {
    from: EMAIL_FROM,
    to,
    subject: 'Welcome to PrepTracker! 🎯',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #F97316; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">PrepTracker 🎯</h1>
        </div>
        <div style="padding: 24px; color: #374151; line-height: 1.6;">
          <h2 style="color: #111827; margin-top: 0;">Hi ${fullName}, welcome aboard!</h2>
          <p>We are excited to help you on your preparation journey. Here are some quick tips to get started:</p>
          <ul style="padding-left: 20px;">
            <li style="margin-bottom: 8px;">Upload resume for ATS scoring</li>
            <li style="margin-bottom: 8px;">Take AI powered practice tests</li>
            <li style="margin-bottom: 8px;">Track your readiness score</li>
          </ul>
          <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="background-color: #F97316; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
          </div>
          <p style="margin-bottom: 0;">Best regards,<br><strong>PrepTracker Team</strong></p>
        </div>
        <div style="background-color: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
          PrepTracker &copy; ${new Date().getFullYear()}
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(`Welcome email failed: ${error.message}`);
  }
};

/**
 * Sends a password reset email to a user.
 */
export const sendPasswordResetEmail = async (to, resetLink) => {
  const mailOptions = {
    from: EMAIL_FROM,
    to,
    subject: 'Reset your PrepTracker password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #F97316; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">PrepTracker 🎯</h1>
        </div>
        <div style="padding: 24px; color: #374151; line-height: 1.6;">
          <h2 style="color: #111827; margin-top: 0;">Reset your password</h2>
          <p>We received a request to reset the password for your PrepTracker account. Click the button below to proceed:</p>
          <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
            <a href="${resetLink}" style="background-color: #F97316; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="font-weight: bold; color: #d97706;">This link expires in 1 hour</p>
          <p style="color: #dc2626; font-size: 13px;">If you did not request this, ignore this email</p>
          <p style="margin-bottom: 0;">Best regards,<br><strong>PrepTracker Team</strong></p>
        </div>
        <div style="background-color: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
          PrepTracker &copy; ${new Date().getFullYear()}
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(`Password reset email failed: ${error.message}`);
  }
};

/**
 * Sends a congratulatory email when a student is placed.
 */
export const sendPlacementCongrats = async (to, fullName, company) => {
  const mailOptions = {
    from: EMAIL_FROM,
    to,
    subject: '🎉 Congratulations on your placement!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #22C55E; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">PrepTracker 🎯</h1>
        </div>
        <div style="padding: 24px; color: #374151; line-height: 1.6;">
          <h2 style="color: #111827; margin-top: 0;">Congratulations ${fullName}!</h2>
          <p style="font-size: 16px; font-weight: bold; color: #16a34a;">You have been placed at ${company}!</p>
          <p>This is a magnificent achievement and we are incredibly proud to have been a part of your preparation path.</p>
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 24px 0; color: #15803d; text-align: center; font-weight: bold;">
            🎉 Success! Best of luck in your new career!
          </div>
          <p style="margin-bottom: 0;">Best regards,<br><strong>PrepTracker Team</strong></p>
        </div>
        <div style="background-color: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
          PrepTracker &copy; ${new Date().getFullYear()}
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(`Placement congrats email failed: ${error.message}`);
  }
};
