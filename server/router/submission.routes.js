import express from 'express';
import Auth from '../middleware/auth.js'; // Middleware xác thực người dùng
import {
   startTest,
   submitAnswer,
   finishTest,
   getSubmissionById,
   getAllSubmissionsByUser
} from '../controllers/SumissionController.js'; // Import các hàm xử lý từ controller

const router = express.Router();

// 1. Bắt đầu một bài kiểm tra mới (user bắt đầu làm bài)
router.post('/start', Auth, startTest);

// 2. Nộp câu trả lời cho một câu hỏi trong bài kiểm tra
router.post('/:submissionId/answer', Auth, submitAnswer);

// 3. Hoàn thành và nộp toàn bộ bài kiểm tra
router.put('/:submissionId/finish', Auth, finishTest);

// 4. Lấy thông tin chi tiết của một bài làm theo ID
router.get('/:submissionId', Auth, getSubmissionById);

// 5. Lấy tất cả các bài làm của một người dùng cụ thể
router.get('/user/:userId', Auth, getAllSubmissionsByUser);

export default router;
