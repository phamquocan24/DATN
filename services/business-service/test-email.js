const EmailService = require('./services/EmailService');

async function testEmail() {
  console.log('🧪 Testing Email Service...\n');
  
  const emailService = new EmailService();
  
  try {
    // Test password reset email
    console.log('📧 Sending test password reset email...');
    const result = await emailService.sendPasswordResetEmail(
      'test@example.com', // Replace with your real email for testing
      '123456',
      'Test User'
    );
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('📋 Message ID:', result.messageId);
    } else {
      console.log('❌ Email failed to send');
      console.log('🔍 Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEmail();