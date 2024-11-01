import { Router } from 'express';
import Auth from '../middleware/auth.js';
import * as testController from '../controllers/TestController.js';

const router = Router();

// Route tạo bài kiểm tra mới
router.post('/create', Auth, testController.verifyInstructorRole, testController.createTest);

// Route lấy tất cả bài kiểm tra của instructor
router.get('/', Auth, testController.verifyInstructorRole, testController.getAllTests);

// Route lấy bài kiểm tra theo ID
router.get('/:id', Auth, testController.getTestById);

// Route xóa bài kiểm tra
router.delete('/:id', Auth, testController.verifyInstructorRole, testController.deleteTest);

router.put('/update/:id', Auth, testController.verifyInstructorRole, testController.updateTest)

// Route lấy bài làm theo ID bài kiểm tra
router.get('/:test_id/submissions', Auth, testController.verifyInstructorRole, testController.getSubmissionsByTestId);

// ==================== Admin Routes ==================== //

export default router;
