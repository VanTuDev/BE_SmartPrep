import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv'
dotenv.config();

export const sendEmailService = () => {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        }
      });
      
      var mailOptions = {
        from: 'Smart Prep <flywtan@gmail.com>',
        to: 'tanhtde170068@fpt.edu.vn',
        subject: 'Your application have been approved!',
        html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2 style="color: #4CAF50;">Application Approved <span style="font-size: 24px;">✔</span></h2>
                    <p>Chúc mừng, bạn đã được <strong>phê duyệt</strong>!</p>
                    <p>Bạn có thể chính thức trở thành giáo viên trong hệ thống của chúng tôi. Vui lòng đăng nhập và bắt đầu chia sẻ kiến thức của bạn.</p>
                    <p><a href="https://yourapp.com/login" style="color: #4CAF50; text-decoration: none;">Đăng nhập ngay</a></p>
                </div>
            `
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
}