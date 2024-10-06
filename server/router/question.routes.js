import { Router } from 'express';
import * as questionController from '../controllers/QuestionController.js';
import Auth from '../middleware/auth.js'; // Middleware xác thực người dùng
import multer from 'multer';

const upload = multer();
const router = Router();

router.post('/create', Auth, questionController.verifyInstructorRole, questionController.createQuestion); // Route thêm câu hỏi mới
router.get('/', Auth, questionController.getAllQuestions); // Route lấy tất cả các câu hỏi (chỉ của Instructor hiện tại)
router.get('/:id', Auth, questionController.getQuestionById); // Route lấy câu hỏi theo ID
router.get('/category/:categoryId', Auth, questionController.getQuestionsByCategory); // Route lấy tất cả câu hỏi theo danh mục
router.put('/:id', Auth, questionController.verifyInstructorRole, questionController.updateQuestion); // Route cập nhật câu hỏi
router.delete('/:id', Auth, questionController.verifyInstructorRole, questionController.deleteQuestion); // Route xóa câu hỏi
router.post('/upload', Auth, questionController.verifyInstructorRole, upload.single('file'), questionController.addQuestionsFromExcel); // Route thêm câu hỏi từ file Excel

export default router;
