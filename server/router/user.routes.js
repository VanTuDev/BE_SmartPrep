// user.routes.js
import { Router } from 'express';
const router = Router();
import * as userController from '../controllers/UserController.js';
import Auth from '../middleware/auth.js';
import upload from '../middleware/upload.js'; // Nhập middleware xử lý upload file ảnh

// Định nghĩa các route cho người dùng
router.post('/register', userController.register); // Đăng ký tài khoản mới
router.post('/login', userController.login); // Đăng nhập tài khoản

// Lấy thông tin hồ sơ người dùng đã đăng nhập (dựa vào token JWT)
router.get('/profile', Auth, userController.getUserProfile);

// Lấy thông tin người dùng theo username
router.get('/user/:username', userController.getUser);

// Lấy thông tin người dùng theo ID (yêu cầu phải đăng nhập với quyền hạn phù hợp)
router.get('/user/id/:id', Auth, userController.getUserById);

// Lấy danh sách tất cả người dùng (Chỉ Admin có quyền truy cập)
router.get('/users', Auth, userController.getAllUsers);
router.get('/all', Auth, userController.getAllUsers);

// Cập nhật thông tin người dùng (có hỗ trợ upload ảnh đại diện)
router.put('/updateuser', Auth, upload.single('profile'), userController.updateUser);

// Xóa người dùng (yêu cầu quyền Admin)
router.delete('/deleteuser/:id', Auth, userController.deleteUser);

export default router;
