import { Router } from 'express';
import * as groupController from '../controllers/GroupQuestionController.js'; // Nhập controller cho nhóm
import Auth from '../middleware/auth.js'; // Nhập middleware để xác thực người dùng

const router = Router();

// Tạo nhóm mới
router.post('/create', Auth, groupController.createGroup);

// Lấy tất cả các nhóm
router.get('/', Auth, groupController.getAllGroups);

// Lấy danh sách câu hỏi theo nhóm
router.get('/:id/questions', groupController.getQuestionsByGroupId);

// Cập nhật nhóm
router.put('/:id', Auth, groupController.updateGroup);

// Xóa nhóm
router.delete('/:id', Auth, groupController.deleteGroup);

export default router; // Xuất router
