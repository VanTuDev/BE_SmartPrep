import express from 'express';
import {createMessage, ViewMessage} from '../controllers/ClassRoomController.js';// Hàm xử lý tạo tin nhắn
import Auth from '../middleware/auth.js'; // Middleware xác thực

const router = express.Router();

// Route gửi tin nhắn đến lớp học xác định qua classId
router.post('/classes/:classId/messages', Auth, createMessage);

// Route để lấy toàn bộ tin nhắn của một lớp học cụ thể
router.get('/classes/:classId/messages', Auth, ViewMessage);

export default router;
