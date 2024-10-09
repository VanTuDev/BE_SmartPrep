import { Router } from 'express';
import * as questionController from '../controllers/QuestionController.js';
import Auth from '../middleware/auth.js'; // Middleware xác thực người dùng
import multer from 'multer';

const upload = multer(); // Khởi tạo multer để xử lý file
const router = Router();

// Route thêm câu hỏi mới
router.post('/create', Auth, questionController.verifyInstructorRole, questionController.createQuestion);
router.post('/create/multiple', Auth, questionController.verifyInstructorRole, questionController.createMultipleQuestions);

// Route lấy tất cả các câu hỏi (chỉ của Instructor hiện tại)
router.get('/', Auth, questionController.getAllQuestions);

// Route lấy câu hỏi theo ID
router.get('/:id', Auth, questionController.getQuestionById);

// Route lấy tất cả câu hỏi theo danh mục
router.get('/category/:categoryId', Auth, questionController.getQuestionsByCategory);

// Route cập nhật câu hỏi
router.put('/:id', Auth, questionController.verifyInstructorRole, questionController.updateQuestion);

// Route xóa câu hỏi
router.delete('/:id', Auth, questionController.verifyInstructorRole, questionController.deleteQuestion);

// Route thêm câu hỏi từ file Excel
router.post('/upload-excel', Auth, upload.single('file'), questionController.addQuestionsFromExcel);
export default router;
