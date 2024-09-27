import nodemailer from 'nodemailer';
import Mailgen from 'mailgen';
import ENV from '../config.js';
const nodeConfig = {
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true cho cổng 465, false cho các cổng khác
    auth: {
        user: ENV.EMAIL, // tài khoản email được tạo từ Ethereal
        pass: ENV.PASSWORD, // mật khẩu cho tài khoản Ethereal
    }
};
const transporter = nodemailer.createTransport(nodeConfig);
const MailGenerator = new Mailgen({
    theme: "default",
    product: {
        name: "Mailgen",
        link: 'https://mailgen.js/'
    }
});


export const registerMail = async (req, res) => {
    const { username, userEmail, text, subject } = req.body;
    if (!userEmail) {
        return res.status(400).send({ error: "Email is required." });
    }
    const email = {
        body: {
            name: username,
            intro: text || 'Welcome to Daily Tuition! We\'re very excited to have you on board.',
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        }
    };

    const emailBody = MailGenerator.generate(email);
    const message = {
        from: ENV.EMAIL,
        to: userEmail,
        subject: subject || "Signup Successful",
        html: emailBody
    };
    transporter.sendMail(message).then(() => {
        return res.status(200).send({ msg: "check box mail" })
    }).catch(error => res.status(500).send({ error }))
};
