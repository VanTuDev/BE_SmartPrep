import jwt from 'jsonwebtoken';
import ENV from '../config.js';

export default async function Auth(req, res, next) {
    try {
        // Lấy token từ header
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(403).json({ error: "Token không hợp lệ!" });
        }

        // Giải mã token
        const decodedToken = jwt.verify(token, ENV.JWT_SECRET);
        req.user = decodedToken; // Gán thông tin người dùng vào req.user
        next(); // Tiếp tục đến middleware hoặc route tiếp theo
    } catch (error) {
        console.error("Lỗi xác thực:", error);
        return res.status(401).json({ error: "Authentication Failed!" });
    }
}
