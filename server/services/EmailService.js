import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv'
dotenv.config();

export const sendEmailService = (email, status) => {
  const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
      },
  });

  let subject, htmlContent;

  if (status === 'approved') {
      subject = 'Your application has been approved!';
      htmlContent = `
          <div style="font-family: Arial, sans-serif; color: #333;">
              <h2 style="color: #4CAF50;">Application Approved <span style="font-size: 24px;">✔</span></h2>
              <p>Chúc mừng, bạn đã được <strong>phê duyệt</strong>!</p>
              <p>Bạn có thể chính thức trở thành giáo viên trong hệ thống của chúng tôi. Vui lòng đăng nhập và bắt đầu chia sẻ kiến thức của bạn.</p>
              <p><a href="https://yourapp.com/login" style="color: #4CAF50; text-decoration: none;">Đăng nhập ngay</a></p>
          </div>
      `;
  } else if (status === 'rejected') {
      subject = 'Your application has been rejected';
      htmlContent = `
          <div style="font-family: Arial, sans-serif; color: #333;">
              <h2 style="color: #FF0000;">Application Rejected <span style="font-size: 24px;">❌</span></h2>
              <p>Chúng tôi rất tiếc phải thông báo rằng đơn đăng ký của bạn <strong>không được phê duyệt</strong>.</p>
              <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi để biết thêm chi tiết.</p>
              <p><a href="https://yourapp.com/contact" style="color: #FF0000; text-decoration: none;">Liên hệ hỗ trợ</a></p>
          </div>
      `;
  }

  const mailOptions = {
      from: 'Smart Prep <flywtan@gmail.com>',
      to: email,
      subject: subject,
      html: htmlContent,
  };

  transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
          console.log(error);
      } else {
          console.log('Email sent: ' + info.response);
      }
  });
};