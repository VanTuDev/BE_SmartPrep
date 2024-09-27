import UserModel from '../model/User.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import ENV from '../config.js';
import otpGenerator from 'otp-generator';

// Xác thực người dùng bằng username hoặc email
export async function verifyUser(req, res, next) {
    try {
        const { identifier } = req.method === "GET" ? req.query : req.body;  // Lấy thông tin từ query hoặc body
        const user = await UserModel.findOne({
            $or: [{ username: identifier }, { email: identifier }]
        });

        if (!user) {
            return res.status(404).send({ error: "Không tìm thấy người dùng!" });
        }
        req.user = user;  // Lưu user vào request để sử dụng trong các hàm khác
        next();
    } catch (error) {
        return res.status(500).send({ error: "Lỗi xác thực người dùng" });
    }
}


// Đăng ký tài khoản mới
export async function register(req, res) {
    try {
        const { username, fullname, email, phone, password, profile } = req.body;

        // Kiểm tra sự tồn tại của username
        const existUsername = await UserModel.findOne({ username });
        if (existUsername) {
            return res.status(400).json({ error: "Tên đăng nhập đã tồn tại" });
        }

        // Kiểm tra sự tồn tại của email
        const existEmail = await UserModel.findOne({ email });
        if (existEmail) {
            return res.status(400).json({ error: "Email đã tồn tại" });
        }

        // Mã hóa mật khẩu và lưu thông tin người dùng
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new UserModel({
            username,
            fullname,
            email,
            phone,
            password: hashedPassword,
            profile: profile || ''
        });

        await newUser.save(); // Lưu người dùng vào cơ sở dữ liệu
        return res.status(201).json({ msg: "Đăng ký thành công" });

    } catch (error) {
        return res.status(500).json({ error: "Lỗi khi đăng ký người dùng" });
    }
}

// Đăng nhập người dùng
export async function login(req, res) {
    const { identifier, password } = req.body;  // identifier có thể là email hoặc username
    try {
        // Tìm kiếm người dùng bằng username hoặc email
        const user = await UserModel.findOne({
            $or: [{ username: identifier }, { email: identifier }]
        });

        // Nếu không tìm thấy người dùng
        if (!user) {
            return res.status(404).json({ error: "Username hoặc Email không tồn tại." });
        }

        // Kiểm tra mật khẩu
        const passwordCheck = await bcrypt.compare(password, user.password);
        if (!passwordCheck) {
            return res.status(400).json({ error: "Mật khẩu không đúng." });
        }

        // Tạo JWT token
        const token = jwt.sign({
            userId: user._id,
            username: user.username
        }, ENV.JWT_SECRET, { expiresIn: "24h" });

        // Trả về kết quả đăng nhập thành công
        return res.status(200).json({
            msg: "Đăng nhập thành công",
            username: user.username,
            token
        });
    } catch (error) {
        return res.status(500).json({ error: "Có lỗi xảy ra trong quá trình đăng nhập." });
    }
}


/** Lấy thông tin người dùng dựa trên username */
export async function getUser(req, res) {
    const { username } = req.params;
    try {
        if (!username) return res.status(501).send({ error: "Tên đăng nhập không hợp lệ" });

        UserModel.findOne({ username }, function (err, user) {
            if (err) return res.status(500).send({ err });
            if (!user) return res.status(501).send({ error: "Không tìm thấy người dùng" });

            // Loại bỏ mật khẩu khi trả về thông tin người dùng
            const { password, ...rest } = Object.assign({}, user.toJSON());
            return res.status(201).send(rest);
        });

    } catch (error) {
        return res.status(404).send({ error: "Không thể tìm thấy dữ liệu người dùng" });
    }
}

// Cập nhật thông tin người dùng
export async function updateUser(req, res) {
    try {
        const { userId } = req.user;
        if (userId) {
            const body = req.body;
            UserModel.updateOne({ _id: userId }, body, function (err, data) {
                if (err) throw err;
                return res.status(201).send({ msg: "Thông tin đã được cập nhật!" });
            });
        } else {
            return res.status(401).send({ error: "Không tìm thấy người dùng!" });
        }
    } catch (error) {
        return res.status(401).send({ error });
    }
}

// Tạo mã OTP
export async function generateOTP(req, res) {
    req.app.locals.OTP = await otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
    res.status(201).send({ code: req.app.locals.OTP });
}

// Xác minh mã OTP
export async function verifyOTP(req, res) {
    const { code } = req.query; // Lấy mã OTP từ query parameter
    try {
        // Kiểm tra mã OTP đã được lưu trong `app.locals`
        if (parseInt(req.app.locals.OTP) === parseInt(code)) {
            req.app.locals.OTP = null; // Reset mã OTP sau khi xác minh thành công
            req.app.locals.resetSession = true; // Bắt đầu session để reset mật khẩu
            return res.status(201).send({ msg: 'Xác minh thành công!' });
        } else {
            return res.status(400).send({ error: "Mã OTP không hợp lệ" });
        }
    } catch (error) {
        return res.status(500).send({ error: "Có lỗi xảy ra trong quá trình xác minh OTP" });
    }
}


// Tạo session để reset mật khẩu
export async function createResetSession(req, res) {
    if (req.app.locals.resetSession) {
        return res.status(201).send({ flag: req.app.locals.resetSession });
    }
    return res.status(440).send({ error: "Session đã hết hạn!" });
}

/** Đặt lại mật khẩu */
export async function resetPassword(req, res) {
    try {
        if (!req.app.locals.resetSession) return res.status(440).send({ error: "Session đã hết hạn!" });
        const { username, password } = req.body;
        try {
            UserModel.findOne({ username })
                .then(user => {
                    bcrypt.hash(password, 10)
                        .then(hashedPassword => {
                            UserModel.updateOne({ username: user.username }, { password: hashedPassword }, function (err, data) {
                                if (err) throw err;
                                req.app.locals.resetSession = false; // Reset session
                                return res.status(201).send({ msg: "Mật khẩu đã được cập nhật!" });
                            });
                        })
                        .catch(e => {
                            return res.status(500).send({
                                error: "Không thể mã hóa mật khẩu"
                            });
                        });
                })
                .catch(error => {
                    return res.status(404).send({ error: "Không tìm thấy tên đăng nhập" });
                });

        } catch (error) {
            return res.status(500).send({ error });
        }

    } catch (error) {
        return res.status(401).send({ error });
    }
}
