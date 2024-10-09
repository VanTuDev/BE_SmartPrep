import { Router } from 'express';
import multer from 'multer';
const router = Router();
const upload = multer();

import * as testController from '../controllers/TestController.js';
import Auth from '../middleware/auth.js';

router.post('/create_with_ques', Auth, testController.verifyInstructorRole, testController.createExamWithQuestions);
router.get('/get_all_test', testController.getAllTest);
router.get('/:id', testController.getTestById);
router.put('/:examId', Auth, testController.verifyInstructorRole, testController.updateExamWithQuestions);
router.delete('/:id', testController.deleteTest);

export default router;
