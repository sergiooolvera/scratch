const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function testGmail() {
  console.log('[DEBUG] Testing Gmail for:', process.env.SMTP_USER);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS?.replace(/\s/g, ''), // Remove spaces
    },
  });

  try {
    await transporter.verify();
    console.log('[SUCCESS] SMTP connection established! Your credentials are correct.');
  } catch (error) {
    console.error('[ERROR] Gmail connection failed:', error.message);
    if (error.message.includes('Username and Password not accepted')) {
      console.log('[TIP] Visit: https://myaccount.google.com/apppasswords');
    }
  }
}

testGmail();
