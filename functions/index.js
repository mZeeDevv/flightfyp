const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Configure the email transport with your SMTP settings
// You'll need to configure your email provider's SMTP settings here
const transporter = nodemailer.createTransport({
  service: 'gmail', // or another service like 'SendGrid', 'Mailgun', etc.
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-email-password-or-app-password'
  }
});

/**
 * Cloud Function to send newsletter emails to subscribers
 * Triggered via an HTTP request from the client
 */
exports.sendNewsletter = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  
  // Check for admin role if you have role-based authentication
  // This is optional - implement if you have admin roles
  try {
    const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    const userData = userDoc.data();
    
    if (!userData || userData.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can send newsletters.'
      );
    }
  } catch (error) {
    console.error('Error checking user role:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to verify admin permissions.'
    );
  }
  
  // Extract email data from the request
  const { recipients, subject, content } = data;
  
  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Recipients must be a non-empty array of email addresses.'
    );
  }
  
  if (!subject || !content) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Subject and content are required.'
    );
  }
  
  try {
    // For large recipient lists, consider batching or using a dedicated email service
    // Here we're using BCC to send to multiple recipients at once
    const mailOptions = {
      from: `"Your Flight App" <${process.env.EMAIL_USER || 'your-email@gmail.com'}>`,
      bcc: recipients,
      subject: subject,
      html: content
    };
    
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    
    // Log the result and return success to the client
    console.log('Email sent:', info.messageId);
    
    // Log to Firestore for record-keeping (optional)
    await admin.firestore().collection('sentEmails').add({
      recipients: recipients,
      subject: subject,
      content: content,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      sentBy: context.auth.uid,
      messageId: info.messageId
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to send email: ${error.message}`
    );
  }
});
