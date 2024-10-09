


import jwt from 'jsonwebtoken';
import ENV from '../config.js';

export default function Auth(req, res, next) {
    try {
        // Lấy token từ header
        const authorizationHeader = req.headers.authorization;
        if (!authorizationHeader) {
            console.error("Không có token trong header.");
            return res.status(403).json({ error: "Không có token! Vui lòng đăng nhập." });
        }

        // Tách token từ chuỗi 'Bearer <token>'
        const token = authorizationHeader.split(" ")[1];
        if (!token) {
            console.error("Token không tồn tại trong header.");
            return res.status(403).json({ error: "Token không tồn tại! Vui lòng đăng nhập." });
        }

        // Giải mã token
        const decodedToken = jwt.verify(token, ENV.JWT_SECRET);
        req.user = decodedToken; // Gán thông tin người dùng vào req.user

        // Kiểm tra thông tin userId trong token
        if (!req.user.userId) {
            console.error("Thông tin người dùng không hợp lệ trong token:", req.user);
            return res.status(401).json({ error: "Thông tin người dùng không hợp lệ!" });
        }

        // Tiếp tục đến middleware hoặc route tiếp theo
        next();
    } catch (error) {
        handleTokenError(error, res); // Gọi hàm xử lý lỗi token
    }
}

// Hàm xử lý lỗi token một cách chi tiết
function handleTokenError(error, res) {
    if (error instanceof jwt.JsonWebTokenError) {
        console.error("Lỗi xác thực: Token không hợp lệ.", error);
        return res.status(401).json({ error: "Token không hợp lệ! Vui lòng đăng nhập." });
    } else if (error instanceof jwt.TokenExpiredError) {
        console.error("Lỗi xác thực: Token đã hết hạn.", error);
        return res.status(401).json({ error: "Token đã hết hạn! Vui lòng đăng nhập." });
    } else {
        console.error("Lỗi xác thực không xác định:", error);
        return res.status(500).json({ error: "Lỗi xác thực! Vui lòng thử lại sau." });
    }
}

