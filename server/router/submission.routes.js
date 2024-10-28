import { Router } from 'express';
import Auth from '../middleware/auth.js';
import * as submissionController from '../controllers/SumissionController.js'; // Sửa chính tả từ 'SumissionController'

const router = Router();

// Route bắt đầu bài kiểm tra
router.post('/start', Auth, submissionController.startTest);

// Route nộp câu trả lời cho một câu hỏi
router.put('/:submissionId/answer', Auth, submissionController.submitAnswer);

// Route hoàn thành và nộp toàn bộ bài kiểm tra
router.put('/:submissionId/finish', Auth, submissionController.finishTest);

// Route lấy thông tin chi tiết một submission theo ID
router.get('/:submissionId', Auth, submissionController.getSubmissionById);

// Route lấy tất cả bài làm của một người dùng cụ thể
router.get('/user/:userId', Auth, submissionController.getAllSubmissionsByUser);

export default router;
