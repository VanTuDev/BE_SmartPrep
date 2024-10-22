// user.routes.js
import { Router } from 'express';
const router = Router();
import * as userController from '../controllers/UserController.js';
import Auth from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js'; // Import chính xác

// Định nghĩa các route cho người dùng
router.post('/register', upload.single('cv'), userController.register); // Đăng ký tài khoản mới
router.post('/login', userController.login); // Đăng nhập tài khoản
router.post('/forgotPW', userController.forgotPW); // Quên MK
router.post('/resetPW', userController.resetPW); // Quên MK

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
router.put('/updateuser', Auth, uploadImage.single('profile'), userController.updateUser);

// Xóa người dùng (yêu cầu quyền Admin)
router.delete('/deleteuser/:id', Auth, userController.deleteUser);

// ADMIN ROUTER
router.get('/admin/get_user/:role', Auth, userController.getUserByRole);

export default router;
