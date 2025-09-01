const nodemailer = require('nodemailer');
const winston = require('winston');

// Setup logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }), 
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/email.log' })
  ]
});

/**
 * Email Service for sending emails via Gmail SMTP
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify connection configuration
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('Email transporter verification failed:', error);
        } else {
          logger.info('Email transporter is ready to send messages');
        }
      });

    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
    }
  }

  /**
   * Send email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML content
   * @param {string} options.text - Plain text content
   * @returns {Promise<Object>}
   */
  async sendEmail(options) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'JobHuntly Recruitment'}" <${process.env.EMAIL_FROM_ADDRESS}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        to: options.to,
        subject: options.subject,
        messageId: result.messageId
      });

      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };

    } catch (error) {
      logger.error('Failed to send email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send OTP email
   * @param {string} email - Recipient email
   * @param {string} otpCode - OTP code
   * @param {string} type - OTP type
   * @returns {Promise<Object>}
   */
  async sendOTPEmail(email, otpCode, type) {
    try {
      const subject = this.getOTPSubject(type);
      const { html, text } = this.getOTPTemplate(otpCode, type);

      return await this.sendEmail({
        to: email,
        subject,
        html,
        text
      });

    } catch (error) {
      logger.error('Failed to send OTP email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send welcome email
   * @param {string} email - Recipient email
   * @param {string} fullName - User's full name
   * @returns {Promise<Object>}
   */
  async sendWelcomeEmail(email, fullName) {
    try {
      const subject = '🎉 Chào mừng bạn đến với JobHuntly!';
      const { html, text } = this.getWelcomeTemplate(fullName);

      return await this.sendEmail({
        to: email,
        subject,
        html,
        text
      });

    } catch (error) {
      logger.error('Failed to send welcome email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send password reset email
   * @param {string} email - Recipient email
   * @param {string} resetToken - Reset token
   * @param {string} fullName - User's full name
   * @returns {Promise<Object>}
   */
  async sendPasswordResetEmail(email, resetToken, fullName) {
    try {
      const subject = '🔒 Đặt lại mật khẩu JobHuntly';
      const { html, text } = this.getPasswordResetTemplate(resetToken, fullName);

      return await this.sendEmail({
        to: email,
        subject,
        html,
        text
      });

    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send job application notification
   * @param {string} email - Recipient email
   * @param {Object} jobData - Job information
   * @param {Object} candidateData - Candidate information
   * @returns {Promise<Object>}
   */
  async sendJobApplicationEmail(email, jobData, candidateData) {
    try {
      const subject = `📋 Ứng tuyển mới cho vị trí: ${jobData.title}`;
      const { html, text } = this.getJobApplicationTemplate(jobData, candidateData);

      return await this.sendEmail({
        to: email,
        subject,
        html,
        text
      });

    } catch (error) {
      logger.error('Failed to send job application email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get OTP subject based on type
   * @param {string} type - OTP type
   * @returns {string}
   */
  getOTPSubject(type) {
    const subjects = {
      REGISTRATION: '📧 Xác thực đăng ký tài khoản JobHuntly',
      LOGIN: '🔐 Mã xác thực đăng nhập JobHuntly',
      PASSWORD_RESET: '🔑 Mã xác thực đặt lại mật khẩu',
      EMAIL_VERIFICATION: '✅ Xác thực địa chỉ email JobHuntly'
    };
    return subjects[type] || '🔢 Mã xác thực JobHuntly';
  }

  /**
   * Get OTP email template
   * @param {string} otpCode - OTP code
   * @param {string} type - OTP type
   * @returns {Object} - HTML and text templates
   */
  getOTPTemplate(otpCode, type) {
    const typeMessages = {
      REGISTRATION: 'đăng ký tài khoản',
      LOGIN: 'đăng nhập',
      PASSWORD_RESET: 'đặt lại mật khẩu',
      EMAIL_VERIFICATION: 'xác thực email'
    };

    const message = typeMessages[type] || 'xác thực';
    const expiryMinutes = 10;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Mã xác thực JobHuntly</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-code { background: #007bff; color: white; font-size: 32px; font-weight: bold; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0; letter-spacing: 5px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚀 JobHuntly Recruitment</h1>
                <p>Mã xác thực ${message}</p>
            </div>
            <div class="content">
                <h2>Xin chào!</h2>
                <p>Bạn đã yêu cầu ${message} trên hệ thống JobHuntly. Vui lòng sử dụng mã xác thực bên dưới:</p>
                
                <div class="otp-code">${otpCode}</div>
                
                <div class="warning">
                    <strong>⚠️ Lưu ý quan trọng:</strong>
                    <ul>
                        <li>Mã này sẽ hết hạn sau <strong>${expiryMinutes} phút</strong></li>
                        <li>Không chia sẻ mã này với bất kỳ ai</li>
                        <li>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email</li>
                    </ul>
                </div>
                
                <p>Cảm ơn bạn đã sử dụng JobHuntly!</p>
            </div>
            <div class="footer">
                <p>© 2025 JobHuntly Recruitment System. All rights reserved.</p>
                <p>Email này được gửi tự động, vui lòng không reply.</p>
            </div>
        </div>
    </body>
    </html>`;

    const text = `
JobHuntly Recruitment - Mã xác thực ${message}

Xin chào!

Bạn đã yêu cầu ${message} trên hệ thống JobHuntly.
Mã xác thực của bạn là: ${otpCode}

Lưu ý:
- Mã này sẽ hết hạn sau ${expiryMinutes} phút
- Không chia sẻ mã này với bất kỳ ai
- Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email

Cảm ơn bạn đã sử dụng JobHuntly!

© 2025 JobHuntly Recruitment System
`;

    return { html, text };
  }

  /**
   * Get welcome email template
   * @param {string} fullName - User's full name
   * @returns {Object} - HTML and text templates
   */
  getWelcomeTemplate(fullName) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Chào mừng đến với JobHuntly</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .feature { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #007bff; }
            .cta-button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Chào mừng đến với JobHuntly!</h1>
                <p>Hệ thống tuyển dụng hàng đầu Việt Nam</p>
            </div>
            <div class="content">
                <h2>Xin chào ${fullName}!</h2>
                <p>Chúc mừng bạn đã tạo tài khoản thành công trên JobHuntly. Bạn đã sẵn sàng khám phá những cơ hội nghề nghiệp tuyệt vời!</p>
                
                <div class="feature">
                    <h3>🔍 Tìm kiếm việc làm</h3>
                    <p>Khám phá hàng nghìn cơ hội việc làm từ các công ty hàng đầu</p>
                </div>
                
                <div class="feature">
                    <h3>📄 Quản lý CV</h3>
                    <p>Tạo và quản lý CV chuyên nghiệp, tăng cơ hội được tuyển dụng</p>
                </div>
                
                <div class="feature">
                    <h3>🤖 AI Matching</h3>
                    <p>Hệ thống AI thông minh giúp kết nối bạn với công việc phù hợp</p>
                </div>
                
                <div style="text-align: center;">
                    <a href="https://topcv.click" class="cta-button">Bắt đầu tìm việc ngay</a>
                </div>
                
                <p>Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi!</p>
            </div>
            <div class="footer">
                <p>© 2025 JobHuntly Recruitment System. All rights reserved.</p>
                <p>Liên hệ: support@topcv.click | https://topcv.click</p>
            </div>
        </div>
    </body>
    </html>`;

    const text = `
Chào mừng đến với JobHuntly!

Xin chào ${fullName}!

Chúc mừng bạn đã tạo tài khoản thành công trên JobHuntly. Bạn đã sẵn sàng khám phá những cơ hội nghề nghiệp tuyệt vời!

Tính năng nổi bật:
- Tìm kiếm việc làm: Khám phá hàng nghìn cơ hội việc làm
- Quản lý CV: Tạo và quản lý CV chuyên nghiệp  
- AI Matching: Hệ thống AI kết nối bạn với công việc phù hợp

Truy cập: https://topcv.click

© 2025 JobHuntly Recruitment System
Liên hệ: support@topcv.click
`;

    return { html, text };
  }

  /**
   * Get password reset email template
   * @param {string} resetToken - Reset token
   * @param {string} fullName - User's full name
   * @returns {Object} - HTML and text templates
   */
  getPasswordResetTemplate(resetToken, fullName) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Đặt lại mật khẩu JobHuntly</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .token-box { background: white; border: 3px solid #dc3545; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0; }
            .token-code { font-size: 32px; font-weight: bold; color: #dc3545; letter-spacing: 8px; font-family: monospace; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔒 JobHuntly Recruitment</h1>
                <p>Yêu cầu đặt lại mật khẩu</p>
            </div>
            <div class="content">
                <h2>Xin chào ${fullName}!</h2>
                <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản JobHuntly của bạn.</p>
                
                <p><strong>Mã xác thực đặt lại mật khẩu của bạn là:</strong></p>
                
                <div class="token-box">
                    <div class="token-code">${resetToken}</div>
                </div>
                
                <p style="text-align: center; margin: 15px 0;">
                    Vui lòng nhập mã này vào form đặt lại mật khẩu trên website.
                </p>
                
                <div class="warning">
                    <strong>⚠️ Lưu ý bảo mật:</strong>
                    <ul>
                        <li>Mã này sẽ hết hạn sau <strong>15 phút</strong></li>
                        <li>Chỉ sử dụng mã này một lần duy nhất</li>
                        <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                        <li>Không chia sẻ mã này với bất kỳ ai</li>
                    </ul>
                </div>
                
                <p>Nếu bạn gặp khó khăn, vui lòng liên hệ đội hỗ trợ của chúng tôi.</p>
            </div>
            <div class="footer">
                <p>© 2025 JobHuntly Recruitment System. All rights reserved.</p>
                <p>Email này được gửi tự động, vui lòng không reply.</p>
            </div>
        </div>
    </body>
    </html>`;

    const text = `
JobHuntly Recruitment - Đặt lại mật khẩu

Xin chào ${fullName}!

Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản JobHuntly của bạn.

Mã xác thực đặt lại mật khẩu của bạn là: ${resetToken}

Vui lòng nhập mã này vào form đặt lại mật khẩu trên website.

Lưu ý bảo mật:
- Mã này sẽ hết hạn sau 15 phút
- Chỉ sử dụng mã này một lần duy nhất
- Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này
- Không chia sẻ mã này với bất kỳ ai

© 2025 JobHuntly Recruitment System
`;

    return { html, text };
  }

  /**
   * Get job application email template
   * @param {Object} jobData - Job information
   * @param {Object} candidateData - Candidate information
   * @returns {Object} - HTML and text templates
   */
  getJobApplicationTemplate(jobData, candidateData) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Ứng tuyển mới - ${jobData.title}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .job-info { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #28a745; }
            .candidate-info { background: #e8f5e9; padding: 20px; margin: 15px 0; border-radius: 8px; }
            .view-button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📋 Ứng tuyển mới</h1>
                <p>JobHuntly Recruitment System</p>
            </div>
            <div class="content">
                <h2>Bạn có ứng viên mới!</h2>
                <p>Một ứng viên vừa nộp đơn ứng tuyển cho vị trí của bạn.</p>
                
                <div class="job-info">
                    <h3>📌 Thông tin vị trí</h3>
                    <p><strong>Tên vị trí:</strong> ${jobData.title}</p>
                    <p><strong>Mức lương:</strong> ${jobData.salary_min?.toLocaleString()} - ${jobData.salary_max?.toLocaleString()} VND</p>
                    <p><strong>Địa điểm:</strong> ${jobData.address || 'Không xác định'}</p>
                </div>
                
                <div class="candidate-info">
                    <h3>👤 Thông tin ứng viên</h3>
                    <p><strong>Họ tên:</strong> ${candidateData.full_name}</p>
                    <p><strong>Email:</strong> ${candidateData.email}</p>
                    <p><strong>Thời gian ứng tuyển:</strong> ${new Date().toLocaleString('vi-VN')}</p>
                </div>
                
                <div style="text-align: center;">
                    <a href="https://topcv.click/applications" class="view-button">Xem chi tiết ứng tuyển</a>
                </div>
                
                <p>Vui lòng đăng nhập vào hệ thống để xem thông tin chi tiết và CV của ứng viên.</p>
            </div>
            <div class="footer">
                <p>© 2025 JobHuntly Recruitment System. All rights reserved.</p>
                <p>Truy cập: https://topcv.click</p>
            </div>
        </div>
    </body>
    </html>`;

    const text = `
JobHuntly Recruitment - Ứng tuyển mới

Bạn có ứng viên mới!

Thông tin vị trí:
- Tên vị trí: ${jobData.title}
- Mức lương: ${jobData.salary_min?.toLocaleString()} - ${jobData.salary_max?.toLocaleString()} VND
- Địa điểm: ${jobData.address || 'Không xác định'}

Thông tin ứng viên:
- Họ tên: ${candidateData.full_name}
- Email: ${candidateData.email}
- Thời gian ứng tuyển: ${new Date().toLocaleString('vi-VN')}

Truy cập https://topcv.click/applications để xem chi tiết.

© 2025 JobHuntly Recruitment System
`;

    return { html, text };
  }
}

// Export singleton instance
module.exports = new EmailService(); 