import jwt from 'jsonwebtoken';
import ENV from '../config.js';

export default async function Auth(req, res, next) {
    try {
        // Lấy token từ header
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            console.error("Không có token trong header."); // Log lỗi
            return res.status(403).json({ error: "Không có token! Vui lòng đăng nhập." });
        }

        // Giải mã token
        const decodedToken = jwt.verify(token, ENV.JWT_SECRET);
        req.user = decodedToken; // Gán thông tin người dùng vào req.user

        // Kiểm tra thông tin người dùng
        if (!req.user.userId) {
            console.error("Thông tin người dùng không hợp lệ:", req.user); // Log thông tin người dùng
            return res.status(401).json({ error: "Thông tin người dùng không hợp lệ!" });
        }

        next(); // Tiếp tục đến middleware hoặc route tiếp theo
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            // Lỗi khi token không hợp lệ
            console.error("Lỗi xác thực: Token không hợp lệ.", error); // Log lỗi
            return res.status(401).json({ error: "Token không hợp lệ! Vui lòng đăng nhập." });
        } else if (error instanceof jwt.TokenExpiredError) {
            // Lỗi khi token đã hết hạn
            console.error("Lỗi xác thực: Token đã hết hạn.", error); // Log lỗi
            return res.status(401).json({ error: "Token đã hết hạn! Vui lòng đăng nhập." });
        } else {
            // Lỗi khác
            console.error("Lỗi xác thực:", error); // Log lỗi
            return res.status(500).json({ error: "Lỗi xác thực! Vui lòng thử lại sau." });
        }
    }
}
