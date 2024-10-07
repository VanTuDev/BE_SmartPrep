import { Router } from 'express';
const router = Router();
import * as testController from '../controllers/TestControllre.js';
import Auth from '../middleware/auth.js';


// Định nghĩa các route người dùng
router.post('/register', t.register);
router.post('/login', userController.login);
// Các route để lấy và cập nhật thông tin người dùng
router.get('/user/:username', userController.getUser);
router.get('/user/id/:id', Auth, userController.getUserById);
router.get('/users', Auth, userController.getAllUsers); // Chỉ Admin
router.get('/all', Auth, userController.getAllUsers);
// Cập nhật thông tin người dùng
router.put('/updateuser', Auth, userController.updateUser);

// Xóa người dùng
router.delete('/deleteuser/:id', Auth, userController.deleteUser);

export default router;
