import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.EMAIL_SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Log the email configuration (for debugging)
console.log('Email Config:', {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASSWORD ? '****' : 'not set', // Don't log the actual password
  port: process.env.EMAIL_SERVER_PORT
});

// Configure nodemailer with your email settings
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  debug: true, // Enable debug output
  logger: true // Log information into the console
});

// Test the connection
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to take our messages');
  }
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Email server is running', 
    emailConfigured: !!process.env.EMAIL_USER && !!process.env.EMAIL_PASSWORD
  });
});

// Endpoint to send emails
app.post('/send-newsletter', async (req, res) => {
  try {
    const { recipients, subject, content } = req.body;
    
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Recipients must be a non-empty array of email addresses' });
    }
    
    if (!subject || !content) {
      return res.status(400).json({ error: 'Subject and content are required' });
    }
    
    // Create email HTML template
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3b82f6; padding: 20px; color: white; border-radius: 5px 5px 0 0; }
          .content { padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; }
          .footer { font-size: 12px; color: #666; margin-top: 20px; text-align: center; }
          .button { display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${subject}</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>You received this email because you subscribed to our newsletter. 
          If you'd like to unsubscribe, please click <a href="#">here</a>.</p>
        </div>
      </body>
      </html>
    `;
    
    // Send emails in batches to avoid rate limiting
    const batchSize = 20; // Adjust based on your email service limits
    let successCount = 0;
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      // For Gmail, use BCC to send to multiple recipients at once
      const mailOptions = {
        from: `"Flight App" <${process.env.EMAIL_USER}>`,
        bcc: batch,
        subject: subject,
        html: htmlContent
      };
      
      // Send the email
      const info = await transporter.sendMail(mailOptions);
      successCount += batch.length;
      
      // Log the message ID for tracking
      console.log(`Batch ${i/batchSize + 1} sent, ID: ${info.messageId}`);
      
      // Add a delay between batches if needed
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    res.status(200).json({ 
      success: true, 
      message: `Successfully sent emails to ${successCount} recipients` 
    });
    
  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Email server running on port ${PORT}`);
  console.log(`Check it works: http://localhost:${PORT}/test`);
});
