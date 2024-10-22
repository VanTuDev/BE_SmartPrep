import jwt from 'jsonwebtoken';
import ENV from '../config.js';

/**
 * Middleware xác thực người dùng bằng JWT.
 * Kiểm tra token hợp lệ và gán thông tin người dùng vào req.user.
 */
export default function Auth(req, res, next) {
    try {
        // Lấy token từ header
        const authorizationHeader = req.headers.authorization;

        if (!authorizationHeader) {
            console.error("Không có token trong header.");
            return res.status(403).json({ error: "Vui lòng cung cấp token!" });
        }

        // Tách token từ chuỗi 'Bearer <token>'
        const token = authorizationHeader.split(" ")[1];

        if (!token) {
            console.error("Token không tồn tại trong chuỗi Bearer.");
            return res.status(403).json({ error: "Token không hợp lệ!" });
        }

        // Giải mã token và gán thông tin người dùng vào req.user
        const decodedToken = jwt.verify(token, ENV.JWT_SECRET);
        req.user = decodedToken;

        if (!req.user.userId) {
            console.error("Thông tin người dùng trong token không hợp lệ:", req.user);
            return res.status(401).json({ error: "Người dùng không hợp lệ!" });
        }

        // Nếu tất cả đều hợp lệ, tiếp tục đến route tiếp theo
        next();
    } catch (error) {
        handleTokenError(error, res); // Gọi hàm xử lý lỗi token
    }
}

/**
 * Hàm xử lý lỗi token một cách chi tiết.
 */
function handleTokenError(error, res) {
    if (error instanceof jwt.JsonWebTokenError) {
        console.error("Lỗi xác thực: Token không hợp lệ.", error.message);
        return res.status(401).json({ error: "Token không hợp lệ! Vui lòng đăng nhập lại." });
    } else if (error instanceof jwt.TokenExpiredError) {
        console.error("Lỗi xác thực: Token đã hết hạn.", error.message);
        return res.status(401).json({ error: "Token đã hết hạn! Vui lòng đăng nhập lại." });
    } else {
        console.error("Lỗi xác thực không xác định:", error.message);
        return res.status(500).json({ error: "Lỗi xác thực! Vui lòng thử lại sau." });
    }
}
